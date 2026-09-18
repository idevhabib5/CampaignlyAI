/**
 * Meta Graph API Automation Engine (MOCK)
 * Scope Module 4 — OAuth, campaign create/deploy, metrics sync.
 * Swap implementations when META_APP_ID / META_APP_SECRET are configured.
 */

export type MetaConnection = {
  connected: boolean;
  adAccounts: Array<{ id: string; name: string; currency: string }>;
  pages: Array<{ id: string; name: string }>;
  accessTokenPreview: string;
};

export type DeployCampaignInput = {
  name: string;
  dailyBudget: number;
  targeting: {
    countries?: string[];
    cities?: string[];
    radiusKm?: number;
    ageMin?: number;
    ageMax?: number;
    genders?: string[];
    interests?: string[];
  };
  adAccountId?: string;
  pageId?: string;
  creative: {
    headline: string;
    primaryText: string;
    cta: string;
  };
};

export async function connectMetaAccount(userId: string): Promise<MetaConnection> {
  void userId;
  await delay(700);
  return {
    connected: true,
    adAccounts: [
      { id: "act_100200300", name: "Primary Ad Account", currency: "USD" },
      { id: "act_100200301", name: "Brand Awareness Account", currency: "USD" },
    ],
    pages: [
      { id: "page_778899", name: "Business Facebook Page" },
      { id: "page_778900", name: "Instagram Business Profile" },
    ],
    accessTokenPreview: "EAAG...mock_token_expires_in_60d",
  };
}

export async function deployCampaign(input: DeployCampaignInput) {
  await delay(900);
  const metaCampaignId = `meta_camp_${Date.now().toString(36)}`;
  return {
    success: true,
    metaCampaignId,
    metaAdSetId: `meta_adset_${Date.now().toString(36)}`,
    metaAdId: `meta_ad_${Date.now().toString(36)}`,
    status: "PENDING_REVIEW" as const,
    message:
      "Campaign submitted to Meta for automated review (mock). Approval is not guaranteed by the platform (LI-2).",
    targetingApplied: input.targeting,
  };
}

export async function syncCampaignMetrics(metaCampaignId: string, current: {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
}) {
  await delay(500);
  const bump = Math.floor(Math.random() * 120) + 40;
  const clicks = current.clicks + Math.floor(bump * 0.04);
  const conversions = current.conversions + Math.floor(Math.random() * 3);
  const spend = Number((current.spend + Math.random() * 8 + 2).toFixed(2));
  return {
    metaCampaignId,
    impressions: current.impressions + bump,
    clicks,
    conversions,
    spend,
    ctr: clicks / Math.max(current.impressions + bump, 1),
    syncedAt: new Date().toISOString(),
  };
}

export async function checkMetaApiHealth() {
  return {
    status: "healthy" as const,
    latencyMs: 120 + Math.floor(Math.random() * 80),
    lastError: null,
    mock: true,
  };
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
