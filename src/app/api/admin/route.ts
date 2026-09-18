export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { requireAdmin, requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonOk } from "@/lib/api";
import { checkMetaApiHealth } from "@/lib/services/meta";
import { processScheduledFollowUps } from "@/lib/services/whatsapp";
import { z } from "zod";

export async function GET() {
  try {
    await requireAdmin();

    const [users, campaigns, leads, creatives, subscriptions, enquiries] = await Promise.all([
      prisma.user.count(),
      prisma.campaign.count(),
      prisma.lead.count(),
      prisma.adCreative.count(),
      prisma.subscription.groupBy({ by: ["plan", "status"], _count: true }),
      prisma.contactEnquiry.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    ]);

    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        subscription: true,
        business: { select: { businessName: true, industry: true, onboardingComplete: true } },
        _count: { select: { campaigns: true, leads: true, creatives: true } },
      },
    });

    const metaHealth = await checkMetaApiHealth();
    const jobs = await processScheduledFollowUps();

    return jsonOk({
      metrics: {
        users,
        campaigns,
        leads,
        creatives,
        subscriptions,
      },
      recentUsers,
      enquiries,
      metaHealth,
      jobs,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

const patchSchema = z.object({
  userId: z.string(),
  plan: z.string().optional(),
  status: z.string().optional(),
});

export async function PATCH(req: Request) {
  try {
    await requireAdmin();
    const data = patchSchema.parse(await req.json());
    const subscription = await prisma.subscription.update({
      where: { userId: data.userId },
      data: {
        ...(data.plan ? { plan: data.plan } : {}),
        ...(data.status ? { status: data.status } : {}),
      },
    });
    return jsonOk({ subscription });
  } catch (error) {
    return handleApiError(error);
  }
}

// Dashboard summary for owners
export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json().catch(() => ({}));
    if (body.scope === "admin") {
      return GET();
    }

    const [campaigns, leads, creatives, notifications, conversations] = await Promise.all([
      prisma.campaign.findMany({ where: { userId: session.id } }),
      prisma.lead.findMany({ where: { userId: session.id } }),
      prisma.adCreative.count({ where: { userId: session.id } }),
      prisma.notification.findMany({
        where: { userId: session.id },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.whatsAppConversation.count({
        where: { userId: session.id, readyForConversion: true },
      }),
    ]);

    const totals = campaigns.reduce(
      (acc, c) => {
        acc.impressions += c.impressions;
        acc.clicks += c.clicks;
        acc.conversions += c.conversions;
        acc.spend += c.spend;
        return acc;
      },
      { impressions: 0, clicks: 0, conversions: 0, spend: 0 }
    );

    return jsonOk({
      totals,
      campaignCount: campaigns.length,
      activeCampaigns: campaigns.filter((c) => c.status === "ACTIVE").length,
      leadCount: leads.length,
      hotLeads: leads.filter((l) => l.status === "CONVERSION_READY").length,
      creatives,
      conversionReadyConversations: conversations,
      notifications,
      recentCampaigns: campaigns.slice(0, 5),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
