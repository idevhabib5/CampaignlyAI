export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonOk } from "@/lib/api";
import {
  getPlacementSizes,
  getMediaPipelineMeta,
  uploadMediaFile,
  processResize,
  processBrand,
  processEnhance,
  processSnippet,
  processCaptions,
  processManualEdit,
  processSaveCaptions,
  deleteObject,
  repairLocalAssetUrl,
} from "@/lib/services/media";

export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const url = new URL(req.url);
    const parentId = url.searchParams.get("parentId");
    const assets = await prisma.mediaAsset.findMany({
      where: {
        userId: session.id,
        ...(parentId ? { parentId } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    // Repair broken local preview URLs (absolute localhost + JPEG saved as .png)
    const repaired = await Promise.all(
      assets.map(async (asset) => {
        const fix = await repairLocalAssetUrl(asset);
        if (fix.changed) {
          return prisma.mediaAsset.update({
            where: { id: asset.id },
            data: {
              url: fix.url,
              storageKey: fix.storageKey,
              mimeType: fix.mimeType,
            },
          });
        }
        return asset;
      })
    );

    const pipeline = await getMediaPipelineMeta();
    return jsonOk({ assets: repaired, placements: getPlacementSizes(), pipeline });
  } catch (error) {
    return handleApiError(error);
  }
}

const actionSchema = z.object({
  action: z.enum([
    "caption",
    "save_captions",
    "resize",
    "brand",
    "enhance",
    "snippet",
    "manual_edit",
    "delete",
  ]),
  assetId: z.string().min(1),
  placementId: z.string().optional(),
  durationSec: z.number().optional(),
  captionText: z.string().optional(),
  crop: z
    .object({
      x: z.number(),
      y: z.number(),
      w: z.number(),
      h: z.number(),
    })
    .optional(),
  trim: z
    .object({
      startSec: z.number(),
      endSec: z.number(),
    })
    .optional(),
});

async function getBrandKit(userId: string) {
  const profile = await prisma.businessProfile.findUnique({ where: { userId } });
  return {
    brandColors: profile?.brandColors || "#0f766e,#ea580c",
    logoUrl: profile?.logoUrl || null,
    industry: profile?.industry || null,
    businessName: profile?.businessName || null,
  };
}

async function createChildAsset(
  userId: string,
  parentId: string,
  data: {
    filename: string;
    mimeType: string;
    mediaType: string;
    url: string;
    storageKey?: string;
    width?: number;
    height?: number;
    durationSec?: number;
    brandApplied?: boolean;
    captions?: string;
    captionTrackUrl?: string;
    placement?: string;
    source: string;
    notes?: string;
  }
) {
  return prisma.mediaAsset.create({
    data: {
      userId,
      parentId,
      filename: data.filename,
      mimeType: data.mimeType,
      mediaType: data.mediaType,
      url: data.url,
      storageKey: data.storageKey,
      width: data.width,
      height: data.height,
      durationSec: data.durationSec,
      brandApplied: data.brandApplied ?? false,
      captions: data.captions,
      captionTrackUrl: data.captionTrackUrl,
      placement: data.placement,
      source: data.source,
      processingStatus: "ready",
      notes: data.notes,
    },
  });
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const contentType = req.headers.get("content-type") || "";

    // FE-1: multipart upload
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        throw new Error("Missing file field");
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploaded = await uploadMediaFile({
        userId: session.id,
        filename: file.name || "upload.bin",
        mimeType: file.type || "application/octet-stream",
        buffer,
      });
      const asset = await prisma.mediaAsset.create({
        data: {
          userId: session.id,
          filename: uploaded.filename,
          mimeType: uploaded.mimeType,
          mediaType: uploaded.mediaType,
          url: uploaded.url,
          storageKey: uploaded.storageKey,
          width: uploaded.width,
          height: uploaded.height,
          durationSec: uploaded.durationSec,
          source: uploaded.source,
          processingStatus: "ready",
          notes: uploaded.notes,
        },
      });
      const pipeline = await getMediaPipelineMeta();
      return jsonOk({ asset, pipeline });
    }

    // JSON actions
    const body = actionSchema.parse(await req.json());
    const asset = await prisma.mediaAsset.findFirst({
      where: { id: body.assetId, userId: session.id },
    });
    if (!asset) throw new Error("Asset not found");

    if (body.action === "delete") {
      await deleteObject(asset.storageKey);
      await prisma.mediaAsset.delete({ where: { id: asset.id } });
      return jsonOk({ deleted: true, id: asset.id });
    }

    const brand = await getBrandKit(session.id);
    const ref = {
      id: asset.id,
      userId: asset.userId,
      filename: asset.filename,
      mimeType: asset.mimeType,
      mediaType: asset.mediaType,
      url: asset.url,
      storageKey: asset.storageKey,
      width: asset.width,
      height: asset.height,
      durationSec: asset.durationSec,
    };

    await prisma.mediaAsset.update({
      where: { id: asset.id },
      data: { processingStatus: "processing" },
    });

    try {
      if (body.action === "caption") {
        const result = await processCaptions({
          asset: ref,
          industry: brand.industry,
          businessName: brand.businessName,
        });
        const updated = await prisma.mediaAsset.update({
          where: { id: asset.id },
          data: {
            captions: result.captions,
            captionTrackUrl: result.captionTrackUrl,
            processingStatus: "ready",
            notes: result.notes,
          },
        });
        return jsonOk({ asset: updated, provider: result.provider });
      }

      if (body.action === "save_captions") {
        const text = body.captionText?.trim();
        if (!text) throw new Error("Enter caption text before saving.");
        const result = await processSaveCaptions({ asset: ref, text });
        const updated = await prisma.mediaAsset.update({
          where: { id: asset.id },
          data: {
            captions: result.captions,
            captionTrackUrl: result.captionTrackUrl,
            processingStatus: "ready",
            notes: result.notes,
          },
        });
        return jsonOk({ asset: updated });
      }

      if (body.action === "resize") {
        if (!body.placementId) throw new Error("placementId required");
        const out = await processResize({ asset: ref, placementId: body.placementId });
        const child = await createChildAsset(session.id, asset.id, {
          filename: out.filename,
          mimeType: out.mimeType,
          mediaType: out.mediaType,
          url: out.url,
          storageKey: out.storageKey,
          width: out.width,
          height: out.height,
          durationSec: "durationSec" in out ? out.durationSec : undefined,
          brandApplied: out.brandApplied,
          placement: out.placement,
          source: out.source,
          notes: out.notes,
        });
        await prisma.mediaAsset.update({
          where: { id: asset.id },
          data: { processingStatus: "ready" },
        });
        return jsonOk({ asset: child });
      }

      if (body.action === "brand") {
        const out = await processBrand({
          asset: ref,
          brand: { brandColors: brand.brandColors, logoUrl: brand.logoUrl },
        });
        const child = await createChildAsset(session.id, asset.id, {
          filename: out.filename,
          mimeType: out.mimeType,
          mediaType: out.mediaType,
          url: out.url,
          storageKey: out.storageKey,
          width: out.width,
          height: out.height,
          durationSec: "durationSec" in out ? out.durationSec : undefined,
          brandApplied: true,
          source: out.source,
          notes: out.notes,
        });
        await prisma.mediaAsset.update({
          where: { id: asset.id },
          data: { processingStatus: "ready" },
        });
        return jsonOk({ asset: child });
      }

      if (body.action === "enhance") {
        const out = await processEnhance({ asset: ref });
        const child = await createChildAsset(session.id, asset.id, {
          filename: out.filename,
          mimeType: out.mimeType,
          mediaType: out.mediaType,
          url: out.url,
          storageKey: out.storageKey,
          width: out.width,
          height: out.height,
          brandApplied: false,
          source: out.source,
          notes: out.notes,
        });
        await prisma.mediaAsset.update({
          where: { id: asset.id },
          data: { processingStatus: "ready" },
        });
        return jsonOk({ asset: child });
      }

      if (body.action === "snippet") {
        const out = await processSnippet({ asset: ref, durationSec: body.durationSec });
        const child = await createChildAsset(session.id, asset.id, {
          filename: out.filename,
          mimeType: out.mimeType,
          mediaType: out.mediaType,
          url: out.url,
          storageKey: out.storageKey,
          width: out.width,
          height: out.height,
          durationSec: out.durationSec,
          brandApplied: false,
          source: out.source,
          notes: out.notes,
        });
        await prisma.mediaAsset.update({
          where: { id: asset.id },
          data: { processingStatus: "ready" },
        });
        return jsonOk({ asset: child });
      }

      if (body.action === "manual_edit") {
        const out = await processManualEdit({
          asset: ref,
          crop: body.crop,
          trim: body.trim,
        });
        const child = await createChildAsset(session.id, asset.id, {
          filename: out.filename,
          mimeType: out.mimeType,
          mediaType: out.mediaType,
          url: out.url,
          storageKey: out.storageKey,
          width: out.width,
          height: out.height,
          durationSec: "durationSec" in out ? out.durationSec : undefined,
          brandApplied: false,
          source: out.source,
          notes: out.notes,
        });
        await prisma.mediaAsset.update({
          where: { id: asset.id },
          data: { processingStatus: "ready" },
        });
        return jsonOk({ asset: child });
      }

      throw new Error("Unknown action");
    } catch (err) {
      await prisma.mediaAsset.update({
        where: { id: asset.id },
        data: { processingStatus: "failed" },
      });
      throw err;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
