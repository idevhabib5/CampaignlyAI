export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { connectMetaAccount, deployCampaign, syncCampaignMetrics } from "@/lib/services/meta";

export async function GET() {
  try {
    const session = await requireSession();
    const campaigns = await prisma.campaign.findMany({
      where: { userId: session.id },
      include: { adCreative: true, _count: { select: { leads: true } } },
      orderBy: { createdAt: "desc" },
    });
    return jsonOk({ campaigns });
  } catch (error) {
    return handleApiError(error);
  }
}

const createSchema = z.object({
  name: z.string().min(2),
  adCreativeId: z.string(),
  dailyBudget: z.number().min(1).default(20),
  targeting: z
    .object({
      countries: z.array(z.string()).optional(),
      cities: z.array(z.string()).optional(),
      radiusKm: z.number().optional(),
      ageMin: z.number().optional(),
      ageMax: z.number().optional(),
      genders: z.array(z.string()).optional(),
      interests: z.array(z.string()).optional(),
    })
    .optional(),
  adAccountId: z.string().optional(),
  pageId: z.string().optional(),
  deploy: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const data = createSchema.parse(await req.json());

    const creative = await prisma.adCreative.findFirst({
      where: { id: data.adCreativeId, userId: session.id },
    });
    if (!creative) return jsonError("Ad creative not found", 404);

    const targeting = data.targeting || {
      countries: ["US"],
      cities: [],
      radiusKm: 25,
      ageMin: 25,
      ageMax: 45,
      interests: [],
    };

    let metaResult = null;
    let status = "DRAFT";
    let metaCampaignId: string | undefined;
    let metaAdAccountId = data.adAccountId;
    let facebookPageId = data.pageId;

    if (data.deploy) {
      await connectMetaAccount(session.id);
      metaResult = await deployCampaign({
        name: data.name,
        dailyBudget: data.dailyBudget,
        targeting,
        adAccountId: data.adAccountId,
        pageId: data.pageId,
        creative: {
          headline: creative.headline,
          primaryText: creative.primaryText,
          cta: creative.cta,
        },
      });
      status = metaResult.status;
      metaCampaignId = metaResult.metaCampaignId;
      metaAdAccountId = data.adAccountId || "act_100200300";
      facebookPageId = data.pageId || "page_778899";
    }

    const campaign = await prisma.campaign.create({
      data: {
        userId: session.id,
        adCreativeId: creative.id,
        name: data.name,
        dailyBudget: data.dailyBudget,
        targeting: JSON.stringify(targeting),
        status,
        metaCampaignId,
        metaAdAccountId,
        facebookPageId,
      },
      include: { adCreative: true },
    });

    if (metaResult) {
      await prisma.notification.create({
        data: {
          userId: session.id,
          type: "campaign",
          title: "Campaign submitted to Meta",
          message: `${campaign.name} is ${status}. ${metaResult.message}`,
        },
      });
    }

    return jsonOk({ campaign, meta: metaResult });
  } catch (error) {
    return handleApiError(error);
  }
}

const patchSchema = z.object({
  id: z.string(),
  action: z.enum(["pause", "activate", "stop", "duplicate", "sync"]),
});

export async function PATCH(req: Request) {
  try {
    const session = await requireSession();
    const data = patchSchema.parse(await req.json());
    const campaign = await prisma.campaign.findFirst({
      where: { id: data.id, userId: session.id },
    });
    if (!campaign) return jsonError("Campaign not found", 404);

    if (data.action === "duplicate") {
      const copy = await prisma.campaign.create({
        data: {
          userId: session.id,
          adCreativeId: campaign.adCreativeId,
          name: `${campaign.name} (Copy)`,
          objective: campaign.objective,
          status: "DRAFT",
          dailyBudget: campaign.dailyBudget,
          targeting: campaign.targeting,
        },
      });
      return jsonOk({ campaign: copy });
    }

    if (data.action === "sync") {
      const metrics = await syncCampaignMetrics(campaign.metaCampaignId || "local", {
        impressions: campaign.impressions,
        clicks: campaign.clicks,
        conversions: campaign.conversions,
        spend: campaign.spend,
      });
      const updated = await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          impressions: metrics.impressions,
          clicks: metrics.clicks,
          conversions: metrics.conversions,
          spend: metrics.spend,
          lastSyncedAt: new Date(),
        },
      });
      return jsonOk({ campaign: updated, metrics });
    }

    const statusMap = {
      pause: "PAUSED",
      activate: "ACTIVE",
      stop: "STOPPED",
    } as const;

    const updated = await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: statusMap[data.action] },
    });
    return jsonOk({ campaign: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
