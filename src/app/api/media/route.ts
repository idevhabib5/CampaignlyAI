import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonOk } from "@/lib/api";
import { getPlacementSizes, uploadMediaMock } from "@/lib/services/media";

export async function GET() {
  try {
    const session = await requireSession();
    const assets = await prisma.mediaAsset.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
    });
    return jsonOk({ assets, placements: getPlacementSizes() });
  } catch (error) {
    return handleApiError(error);
  }
}

const schema = z.object({
  filename: z.string().min(1),
  mimeType: z.string().optional(),
  applyBrand: z.boolean().optional(),
  generateCaptions: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const data = schema.parse(await req.json());
    const uploaded = await uploadMediaMock({
      filename: data.filename,
      mimeType: data.mimeType || "image/jpeg",
      applyBrand: data.applyBrand,
      generateCaptions: data.generateCaptions,
    });

    const asset = await prisma.mediaAsset.create({
      data: {
        userId: session.id,
        filename: uploaded.filename,
        mimeType: uploaded.mimeType,
        mediaType: uploaded.mediaType,
        url: uploaded.url,
        width: uploaded.width,
        height: uploaded.height,
        durationSec: uploaded.durationSec,
        captions: uploaded.captions,
        brandApplied: uploaded.brandApplied,
        notes: "Uploaded via mock S3 layer",
      },
    });

    return jsonOk({ asset });
  } catch (error) {
    return handleApiError(error);
  }
}
