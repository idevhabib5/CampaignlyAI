export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import {
  META_OBJECTIVES,
  assertSelectableAssets,
  controlCampaign,
  deployCampaign,
  listMockMetaAssets,
  resolveLocationCandidate,
  runBradleyFilterForDeploy,
  syncCampaignMetrics,
  type MetaObjective,
  type MetaPlacement,
  type SpecialAdCategory,
} from "@/lib/services/meta";

const objectiveIds = META_OBJECTIVES.map((o) => o.id) as [MetaObjective, ...MetaObjective[]];

async function requireUsableMeta(userId: string) {
  const conn = await prisma.metaConnection.findUnique({ where: { userId } });
  if (!conn || conn.status !== "CONNECTED" || !conn.tokenPreview) {
    return {
      ok: false as const,
      reason: "Meta is not connected or requires reconnect before Meta writes (BR-005 / FR-036).",
    };
  }
  if (!conn.adAccountId || !conn.pageId) {
    return { ok: false as const, reason: "Select a Page and ad account before deploying (FR-027)." };
  }
  const lists = {
    adAccounts: safeJson(conn.adAccountsJson, listMockMetaAssets().adAccounts),
    pages: safeJson(conn.pagesJson, listMockMetaAssets().pages),
  };
  const check = assertSelectableAssets(conn.adAccountId, conn.pageId, lists);
  if (!check.ok) return { ok: false as const, reason: check.reason };
  return { ok: true as const, conn };
}

function safeJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function campaignInclude() {
  return {
    adCreative: true,
    mediaAsset: true,
    _count: { select: { leads: true } },
  } as const;
}

export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (id) {
      const campaign = await prisma.campaign.findFirst({
        where: { id, userId: session.id },
        include: campaignInclude(),
      });
      if (!campaign) return jsonError("Campaign not found", 404);
      return jsonOk({ campaign });
    }
    const campaigns = await prisma.campaign.findMany({
      where: { userId: session.id },
      include: campaignInclude(),
      orderBy: { createdAt: "desc" },
    });
    return jsonOk({ campaigns });
  } catch (error) {
    return handleApiError(error);
  }
}

const targetingSchema = z.object({
  countries: z.array(z.string()).optional(),
  cities: z.array(z.string()).optional(),
  radiusKm: z.number().optional(),
  ageMin: z.number().optional(),
  ageMax: z.number().optional(),
  genders: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
});

const createSchema = z.object({
  name: z.string().min(2),
  adCreativeId: z.string(),
  mediaAssetId: z.string().optional().nullable(),
  objective: z.enum(objectiveIds).default("LEADS"),
  budgetType: z.enum(["DAILY", "LIFETIME"]).default("DAILY"),
  dailyBudget: z.number().min(1).default(20),
  totalBudget: z.number().min(1).optional().nullable(),
  scheduleStart: z.string().optional().nullable(),
  scheduleEnd: z.string().optional().nullable(),
  targeting: targetingSchema.optional(),
  specialAdCategory: z.enum(["NONE", "HOUSING", "EMPLOYMENT", "CREDIT", "POLITICAL"]).default("NONE"),
  resolvedLocation: z.string().optional().nullable(),
  locationConfirmed: z.boolean().optional(),
  placements: z.array(z.enum(["feed_square", "story_reels", "landscape"])).optional(),
  adAccountId: z.string().optional(),
  pageId: z.string().optional(),
  deploy: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const data = createSchema.parse(await req.json());

    if (data.specialAdCategory === "POLITICAL") {
      return jsonError("Political ads cannot be deployed (FR-086 / BR-001).", 400);
    }

    const creative = await prisma.adCreative.findFirst({
      where: { id: data.adCreativeId, userId: session.id },
    });
    if (!creative) return jsonError("Ad creative not found for this business (BR-010).", 404);

    let media = null;
    if (data.mediaAssetId) {
      media = await prisma.mediaAsset.findFirst({
        where: { id: data.mediaAssetId, userId: session.id },
      });
      if (!media) return jsonError("Media asset not found for this business (FR-029 / BR-010).", 404);
    }

    const business = await prisma.businessProfile.findUnique({ where: { userId: session.id } });
    const geocode = resolveLocationCandidate(data.resolvedLocation || business?.location);
    const targeting = data.targeting || {
      countries: ["US"],
      cities: business?.location ? [business.location.split(",")[0].trim()] : ["Austin"],
      radiusKm: 25,
      ageMin: 25,
      ageMax: 45,
      interests: [],
    };

    const placements = (data.placements?.length
      ? data.placements
      : ["feed_square"]) as MetaPlacement[];

    if (data.budgetType === "LIFETIME" && !data.scheduleEnd) {
      return jsonError("Lifetime budget requires an end date (FR-028).", 400);
    }

    const bradley = runBradleyFilterForDeploy({
      headline: creative.headline,
      primaryText: creative.primaryText,
      complianceScore: creative.complianceScore,
      specialAdCategory: data.specialAdCategory,
      targeting,
    });

    let status = "DRAFT";
    let localStatus = "DRAFT";
    let metaStatus: string | null = null;
    let metaResult = null;
    let metaCampaignId: string | undefined;
    let metaAdSetId: string | undefined;
    let metaAdId: string | undefined;
    let metaAdAccountId = data.adAccountId;
    let facebookPageId = data.pageId;
    let locationConfirmedAt: Date | null = null;
    let resolvedLocation = geocode.ok ? geocode.resolvedLocation : data.resolvedLocation || null;

    if (data.deploy) {
      const meta = await requireUsableMeta(session.id);
      if (!meta.ok) return jsonError(meta.reason, 400);

      if (!data.mediaAssetId || !media) {
        return jsonError("Attach an owned media revision before deploy (FR-029).", 400);
      }
      if (!data.locationConfirmed || !geocode.ok) {
        return jsonError(
          geocode.ok
            ? "Confirm the resolved location before deploy (FR-030 / BR-003)."
            : geocode.reason,
          400
        );
      }
      if (!bradley.passed) {
        return jsonError(`Bradley Filter blocked deploy: ${bradley.notes}`, 400);
      }

      metaAdAccountId = data.adAccountId || meta.conn.adAccountId || undefined;
      facebookPageId = data.pageId || meta.conn.pageId || undefined;
      if (!metaAdAccountId || !facebookPageId) {
        return jsonError("Ad account and Page are required (FR-027).", 400);
      }
      const assetCheck = assertSelectableAssets(
        metaAdAccountId,
        facebookPageId,
        {
          adAccounts: safeJson(meta.conn.adAccountsJson, listMockMetaAssets().adAccounts),
          pages: safeJson(meta.conn.pagesJson, listMockMetaAssets().pages),
        }
      );
      if (!assetCheck.ok) return jsonError(assetCheck.reason, 400);

      metaResult = await deployCampaign({
        name: data.name,
        objective: data.objective,
        budgetType: data.budgetType,
        dailyBudget: data.dailyBudget,
        totalBudget: data.totalBudget,
        scheduleStart: data.scheduleStart || new Date().toISOString(),
        scheduleEnd: data.scheduleEnd,
        targeting,
        specialAdCategory: data.specialAdCategory as SpecialAdCategory,
        resolvedLocation: geocode.resolvedLocation,
        placements,
        adAccountId: metaAdAccountId,
        pageId: facebookPageId,
        creative: {
          headline: creative.headline,
          primaryText: creative.primaryText,
          cta: creative.cta,
        },
        media: {
          id: media.id,
          url: media.url,
          mediaType: media.mediaType,
          placement: media.placement,
        },
      });

      if (!metaResult.success) {
        return jsonError(metaResult.error || "Meta deploy failed", 400);
      }

      status = metaResult.status;
      localStatus = "SUBMITTED";
      metaStatus = metaResult.status;
      metaCampaignId = metaResult.metaCampaignId;
      metaAdSetId = metaResult.metaAdSetId;
      metaAdId = metaResult.metaAdId;
      locationConfirmedAt = new Date();
      resolvedLocation = geocode.resolvedLocation;
    } else if (bradley.passed && data.mediaAssetId) {
      localStatus = "READY";
    }

    const campaign = await prisma.campaign.create({
      data: {
        userId: session.id,
        adCreativeId: creative.id,
        mediaAssetId: media?.id || null,
        name: data.name,
        objective: data.objective,
        status,
        localStatus,
        metaStatus,
        budgetType: data.budgetType,
        dailyBudget: data.dailyBudget,
        totalBudget: data.totalBudget ?? null,
        scheduleStart: data.scheduleStart ? new Date(data.scheduleStart) : new Date(),
        scheduleEnd: data.scheduleEnd ? new Date(data.scheduleEnd) : null,
        targeting: JSON.stringify(targeting),
        specialAdCategory: data.specialAdCategory,
        resolvedLocation,
        locationConfirmedAt,
        placements: JSON.stringify(placements),
        metaCampaignId,
        metaAdSetId,
        metaAdId,
        metaAdAccountId,
        facebookPageId,
        metricsAvailable: false,
      },
      include: campaignInclude(),
    });

    if (metaResult?.success) {
      await prisma.notification.create({
        data: {
          userId: session.id,
          type: "campaign",
          title: "Campaign submitted to Meta",
          message: `${campaign.name} is ${status}. ${metaResult.message}`,
        },
      });
    }

    return jsonOk({ campaign, meta: metaResult, bradley });
  } catch (error) {
    return handleApiError(error);
  }
}

const patchSchema = z.object({
  id: z.string(),
  action: z.enum(["pause", "activate", "stop", "duplicate", "sync", "confirm_location", "review"]),
  resolvedLocation: z.string().optional(),
  forceSyncFail: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  try {
    const session = await requireSession();
    const data = patchSchema.parse(await req.json());
    const campaign = await prisma.campaign.findFirst({
      where: { id: data.id, userId: session.id },
      include: { adCreative: true, mediaAsset: true },
    });
    if (!campaign) return jsonError("Campaign not found", 404);

    if (data.action === "confirm_location") {
      const geocode = resolveLocationCandidate(data.resolvedLocation || campaign.resolvedLocation);
      if (!geocode.ok) return jsonError(geocode.reason, 400);
      const updated = await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          resolvedLocation: geocode.resolvedLocation,
          locationConfirmedAt: new Date(),
        },
        include: campaignInclude(),
      });
      return jsonOk({ campaign: updated, geocode });
    }

    if (data.action === "review") {
      const targeting = safeJson(campaign.targeting, {} as Record<string, unknown>);
      const bradley = runBradleyFilterForDeploy({
        headline: campaign.adCreative?.headline || "",
        primaryText: campaign.adCreative?.primaryText || "",
        complianceScore: campaign.adCreative?.complianceScore ?? 0,
        specialAdCategory: campaign.specialAdCategory,
        targeting: targeting as {
          ageMin?: number;
          ageMax?: number;
          countries?: string[];
          cities?: string[];
        },
      });
      const localStatus = bradley.passed && campaign.mediaAssetId ? "READY" : "DRAFT";
      const updated = await prisma.campaign.update({
        where: { id: campaign.id },
        data: { localStatus },
        include: campaignInclude(),
      });
      return jsonOk({ campaign: updated, bradley });
    }

    if (data.action === "duplicate") {
      const copy = await prisma.campaign.create({
        data: {
          userId: session.id,
          adCreativeId: campaign.adCreativeId,
          mediaAssetId: campaign.mediaAssetId,
          name: `${campaign.name} (Copy)`,
          objective: campaign.objective,
          status: "DRAFT",
          localStatus: "DRAFT",
          metaStatus: null,
          budgetType: campaign.budgetType,
          dailyBudget: campaign.dailyBudget,
          totalBudget: campaign.totalBudget,
          targeting: campaign.targeting,
          specialAdCategory: campaign.specialAdCategory,
          resolvedLocation: campaign.resolvedLocation,
          placements: campaign.placements,
          metricsAvailable: false,
        },
        include: campaignInclude(),
      });
      return jsonOk({ campaign: copy });
    }

    if (data.action === "sync") {
      const result = await syncCampaignMetrics(
        campaign.metaCampaignId || "",
        {
          impressions: campaign.impressions,
          clicks: campaign.clicks,
          conversions: campaign.conversions,
          spend: campaign.spend,
          metaStatus: campaign.metaStatus,
        },
        { forceFail: data.forceSyncFail }
      );

      if (!result.success) {
        const updated = await prisma.campaign.update({
          where: { id: campaign.id },
          data: { lastSyncError: result.error },
          include: campaignInclude(),
        });
        return jsonOk({
          campaign: updated,
          metrics: null,
          syncError: result.error,
          preserved: true,
        });
      }

      const updated = await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          impressions: result.impressions,
          clicks: result.clicks,
          conversions: result.conversions,
          spend: result.spend,
          metricsAvailable: result.metricsAvailable,
          metaStatus: result.status,
          status: result.status === "REJECTED" ? "REJECTED" : campaign.status === "DRAFT" ? campaign.status : result.status,
          metaReviewReason: result.reviewReason,
          lastSyncedAt: new Date(),
          lastSyncError: null,
        },
        include: campaignInclude(),
      });
      return jsonOk({ campaign: updated, metrics: result });
    }

    // pause | activate | stop — require Meta connection and provider ack (FR-033)
    const meta = await requireUsableMeta(session.id);
    if (!meta.ok) return jsonError(meta.reason, 400);
    if (!campaign.metaCampaignId) {
      return jsonError("Deploy the campaign to Meta before controlling it.", 400);
    }

    const control = await controlCampaign(campaign.metaCampaignId, data.action);
    if (!control.success) {
      return jsonError(control.error || "Meta control failed", 400);
    }

    const updated = await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        status: control.status,
        metaStatus: control.status,
        lastSyncError: null,
      },
      include: campaignInclude(),
    });
    return jsonOk({ campaign: updated, control });
  } catch (error) {
    return handleApiError(error);
  }
}
