/**
 * Meta Graph API Automation Engine (MOCK by default)
 * Scope Module 4 — OAuth, campaign create/deploy, control, metrics sync.
 * Swap implementations when META_APP_ID / META_APP_SECRET are configured and USE_MOCK_META=false.
 */

export const META_OBJECTIVES = [
  { id: "AWARENESS", label: "Awareness" },
  { id: "TRAFFIC", label: "Traffic" },
  { id: "ENGAGEMENT", label: "Engagement" },
  { id: "LEADS", label: "Leads" },
  { id: "APP_PROMOTION", label: "App promotion" },
  { id: "SALES", label: "Sales" },
] as const;

export type MetaObjective = (typeof META_OBJECTIVES)[number]["id"];

export const SPECIAL_AD_CATEGORIES = [
  { id: "NONE", label: "None" },
  { id: "HOUSING", label: "Housing" },
  { id: "EMPLOYMENT", label: "Employment" },
  { id: "CREDIT", label: "Credit" },
] as const;

export type SpecialAdCategory = (typeof SPECIAL_AD_CATEGORIES)[number]["id"];

export const META_PLACEMENTS = [
  { id: "feed_square", label: "Feed (1:1)", aspect: "1 / 1" },
  { id: "story_reels", label: "Stories / Reels (9:16)", aspect: "9 / 16" },
  { id: "landscape", label: "Landscape (1.91:1)", aspect: "1.91 / 1" },
] as const;

export type MetaPlacement = (typeof META_PLACEMENTS)[number]["id"];

export type MetaAssetLists = {
  adAccounts: Array<{ id: string; name: string; currency: string }>;
  pages: Array<{ id: string; name: string }>;
};

export type MetaConnectionSnapshot = MetaAssetLists & {
  connected: boolean;
  status: "CONNECTED" | "RECONNECT_REQUIRED" | "DISCONNECTED";
  accessTokenPreview: string | null;
  adAccountId: string | null;
  pageId: string | null;
};

export type TargetingInput = {
  countries?: string[];
  cities?: string[];
  radiusKm?: number;
  ageMin?: number;
  ageMax?: number;
  genders?: string[];
  interests?: string[];
};

export type DeployCampaignInput = {
  name: string;
  objective: MetaObjective;
  budgetType: "DAILY" | "LIFETIME";
  dailyBudget: number;
  totalBudget?: number | null;
  scheduleStart: string;
  scheduleEnd?: string | null;
  targeting: TargetingInput;
  specialAdCategory: SpecialAdCategory;
  resolvedLocation: string;
  placements: MetaPlacement[];
  adAccountId: string;
  pageId: string;
  creative: {
    headline: string;
    primaryText: string;
    cta: string;
  };
  media: {
    id: string;
    url: string;
    mediaType: string;
    placement?: string | null;
  };
};

export type ControlAction = "pause" | "activate" | "stop";

const DEMO_ASSETS: MetaAssetLists = {
  adAccounts: [
    { id: "act_100200300", name: "Primary Ad Account", currency: "USD" },
    { id: "act_100200301", name: "Brand Awareness Account", currency: "USD" },
  ],
  pages: [
    { id: "page_778899", name: "Business Facebook Page" },
    { id: "page_778900", name: "Instagram Business Profile" },
  ],
};

export function isMockMetaEnabled() {
  return process.env.USE_MOCK_META !== "false";
}

export function listMockMetaAssets(): MetaAssetLists {
  return DEMO_ASSETS;
}

/** Resolve a business location string into a confirmable candidate (mock geocoder). */
export function resolveLocationCandidate(raw: string | null | undefined) {
  const trimmed = (raw || "").trim();
  if (!trimmed) {
    return { ok: false as const, reason: "Business location is missing. Add it in Settings or onboarding." };
  }
  if (trimmed.length < 3) {
    return { ok: false as const, reason: "Location is too short to resolve. Confirm a city or postcode." };
  }
  const normalized = /,\s*[A-Z]{2}\b/.test(trimmed) || /USA|United States|Australia|AU\b/i.test(trimmed)
    ? trimmed
    : `${trimmed}, USA`;
  return {
    ok: true as const,
    resolvedLocation: normalized,
    radiusKmDefault: 25,
    message: `Resolved to “${normalized}”. Confirm before deploy (FR-030).`,
  };
}

export async function connectMetaAccount(userId: string): Promise<MetaConnectionSnapshot> {
  void userId;
  await delay(700);
  return {
    connected: true,
    status: "CONNECTED",
    adAccounts: DEMO_ASSETS.adAccounts,
    pages: DEMO_ASSETS.pages,
    accessTokenPreview: "EAAG...mock_token_expires_in_60d",
    adAccountId: DEMO_ASSETS.adAccounts[0].id,
    pageId: DEMO_ASSETS.pages[0].id,
  };
}

export async function disconnectMetaAccount(userId: string) {
  void userId;
  await delay(300);
  return {
    connected: false,
    status: "DISCONNECTED" as const,
    message:
      "Meta disconnected. Existing ads may continue running in Meta Ads Manager until you stop them there (FR-036).",
  };
}

export function assertSelectableAssets(
  adAccountId: string,
  pageId: string,
  lists: MetaAssetLists = DEMO_ASSETS
) {
  const accountOk = lists.adAccounts.some((a) => a.id === adAccountId);
  const pageOk = lists.pages.some((p) => p.id === pageId);
  if (!accountOk || !pageOk) {
    return {
      ok: false as const,
      reason: "Selected Page or ad account is not available for this Meta identity (FR-027).",
    };
  }
  return { ok: true as const };
}

/** Bradley Filter recheck before Meta write — internal check only (BR-002). */
export function runBradleyFilterForDeploy(input: {
  headline: string;
  primaryText: string;
  complianceScore: number;
  specialAdCategory: string | null | undefined;
  targeting: TargetingInput;
}) {
  const notes: string[] = [];
  let passed = true;

  if (input.specialAdCategory === "POLITICAL") {
    passed = false;
    notes.push("Political ads are excluded from Phase 1 (BR-001 / FR-086).");
  }

  const text = `${input.headline}\n${input.primaryText}`.toLowerCase();
  if (/\b(vote|ballot|election|political party)\b/.test(text)) {
    passed = false;
    notes.push("Copy appears political. Remove political claims before deploy.");
  }

  if (input.complianceScore < 70) {
    passed = false;
    notes.push(`Creative compliance score ${input.complianceScore} is below the deploy threshold (70).`);
  }

  const category = input.specialAdCategory || "NONE";
  if (category !== "NONE") {
    const ageMin = input.targeting.ageMin ?? 18;
    if (ageMin < 18) {
      passed = false;
      notes.push(`${category} special ad category cannot target under 18.`);
    }
    notes.push(`${category} category applied — interest targeting may be constrained by Meta.`);
  }

  if (passed) {
    notes.push("Bradley Filter: internal policy check passed. Meta still makes the final approval decision (LI-2).");
  }

  return {
    passed,
    score: input.complianceScore,
    notes: notes.join(" "),
    label: "Internal check — not Meta approval",
  };
}

export async function deployCampaign(input: DeployCampaignInput) {
  await delay(900);
  if (!input.adAccountId || !input.pageId) {
    return { success: false as const, error: "Ad account and Page are required." };
  }
  if (input.budgetType === "LIFETIME" && !input.scheduleEnd) {
    return { success: false as const, error: "Lifetime budget requires an end date (FR-028)." };
  }
  if (input.specialAdCategory === ("POLITICAL" as SpecialAdCategory)) {
    return { success: false as const, error: "Political ads cannot be deployed (FR-086)." };
  }

  const stamp = Date.now().toString(36);
  return {
    success: true as const,
    metaCampaignId: `meta_camp_${stamp}`,
    metaAdSetId: `meta_adset_${stamp}`,
    metaAdId: `meta_ad_${stamp}`,
    status: "PENDING_REVIEW" as const,
    message:
      "Campaign submitted to Meta for automated review (mock). Approval is not guaranteed by the platform (LI-2).",
    targetingApplied: input.targeting,
    objective: input.objective,
    placements: input.placements,
  };
}

export async function controlCampaign(
  metaCampaignId: string,
  action: ControlAction,
  options?: { fail?: boolean }
) {
  await delay(500);
  if (!metaCampaignId) {
    return { success: false as const, error: "Campaign has no Meta ID. Deploy it first." };
  }
  if (options?.fail) {
    return {
      success: false as const,
      error: `Meta did not acknowledge ${action}. Last known status kept (FR-033).`,
    };
  }
  const statusMap = {
    pause: "PAUSED",
    activate: "ACTIVE",
    stop: "STOPPED",
  } as const;
  return {
    success: true as const,
    metaCampaignId,
    status: statusMap[action],
    acknowledgedAt: new Date().toISOString(),
  };
}

export async function syncCampaignMetrics(
  metaCampaignId: string,
  current: {
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    metaStatus?: string | null;
  },
  options?: { forceFail?: boolean; forceReject?: boolean }
) {
  await delay(500);

  if (options?.forceFail || (!metaCampaignId && Math.random() < 0)) {
    return {
      success: false as const,
      error: "Meta sync failed (mock). Previous snapshot kept (FR-035).",
      previous: current,
    };
  }

  if (options?.forceReject) {
    return {
      success: true as const,
      metaCampaignId,
      status: "REJECTED" as const,
      reviewReason: "Mock rejection: creative text flagged by Meta review.",
      impressions: current.impressions,
      clicks: current.clicks,
      conversions: current.conversions,
      spend: current.spend,
      metricsAvailable: true,
      syncedAt: new Date().toISOString(),
    };
  }

  const bump = Math.floor(Math.random() * 120) + 40;
  const impressions = current.impressions + bump;
  const clicks = current.clicks + Math.floor(bump * 0.04);
  const conversions = current.conversions + Math.floor(Math.random() * 3);
  const spend = Number((current.spend + Math.random() * 8 + 2).toFixed(2));

  let status = current.metaStatus || "ACTIVE";
  if (status === "PENDING_REVIEW" && Math.random() > 0.35) {
    status = "ACTIVE";
  }

  return {
    success: true as const,
    metaCampaignId,
    status,
    reviewReason: status === "REJECTED" ? "Rejected by Meta" : null,
    impressions,
    clicks,
    conversions,
    spend,
    ctr: clicks / Math.max(impressions, 1),
    metricsAvailable: true,
    syncedAt: new Date().toISOString(),
  };
}

export async function checkMetaApiHealth() {
  return {
    status: "healthy" as const,
    latencyMs: 120 + Math.floor(Math.random() * 80),
    lastError: null,
    mock: isMockMetaEnabled(),
  };
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
