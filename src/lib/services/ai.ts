/**
 * AI Advertising Intelligence Layer (MOCK)
 * Replace with OpenAI + Pinecone RAG when credentials are available.
 * Scope: Modules 2 & RAG Bradley Filter for policy compliance.
 */

export type AdGenerationInput = {
  businessName: string;
  industry: string;
  brandTone: string;
  communicationStyle: string;
  targetAudience?: string | null;
  services?: string | null;
  location?: string | null;
  objective?: string;
  ageMin?: number;
  ageMax?: number;
  gender?: string;
};

export type GeneratedAd = {
  headline: string;
  primaryText: string;
  description: string;
  cta: string;
  variations: Array<{ headline: string; primaryText: string }>;
  complianceScore: number;
  complianceNotes: string;
  ragInsights: string[];
  recommendations: string[];
};

const INDUSTRY_HOOKS: Record<string, string[]> = {
  Fitness: [
    "Transform your body in 30 days",
    "Join {city}'s most supportive gym community",
    "Free trial week — limited spots",
  ],
  Ecommerce: [
    "Free shipping this week only",
    "Bestsellers your customers love",
    "New arrivals just dropped",
  ],
  "Real Estate": [
    "Find your dream home in {city}",
    "Get a free property valuation",
    "New listings you won't want to miss",
  ],
  Beauty: [
    "Glow-up packages from ${price}",
    "Book your spa day today",
    "Limited-time beauty offers",
  ],
  Healthcare: [
    "Same-week appointments available",
    "Trusted care for your family",
    "Book a consultation online",
  ],
  Education: [
    "Enroll now — seats filling fast",
    "Learn skills that get results",
    "Free demo class this weekend",
  ],
  "Local Services": [
    "Trusted local pros — book today",
    "Same-day quotes available",
    "Quality service near you",
  ],
  Restaurant: [
    "Reserve your table tonight",
    "Chef's specials this week",
    "New menu — try us this weekend",
  ],
  Coaching: [
    "Get clarity in one session",
    "Results-driven coaching programs",
    "Book a free discovery call",
  ],
};

const META_POLICY_CHECKS = [
  "No exaggerated personal attributes",
  "No before/after health claims without disclaimer",
  "Clear call-to-action present",
  "Landing intent matches ad promise",
  "No prohibited financial guarantees",
];

function pick<T>(arr: T[], i: number) {
  return arr[i % arr.length];
}

export async function generateAdContent(input: AdGenerationInput): Promise<GeneratedAd> {
  // Simulate LLM latency
  await delay(600);

  const city = input.location?.split(",")[0]?.trim() || "your city";
  const hooks = INDUSTRY_HOOKS[input.industry] || INDUSTRY_HOOKS["Local Services"];
  const audience = input.targetAudience || `people interested in ${input.industry.toLowerCase()}`;
  const services = input.services || input.industry.toLowerCase() + " services";
  const tone = input.brandTone;

  const headline = pick(hooks, 0).replace("{city}", city).replace("${price}", "49");
  const headline2 = pick(hooks, 1).replace("{city}", city).replace("${price}", "49");
  const headline3 = pick(hooks, 2).replace("{city}", city).replace("${price}", "49");

  const primaryText = buildPrimaryText({
    businessName: input.businessName,
    industry: input.industry,
    tone,
    style: input.communicationStyle,
    audience,
    services,
    city,
  });

  const complianceScore = 88 + Math.floor(Math.random() * 10);

  return {
    headline,
    primaryText,
    description: `${input.businessName} · ${input.industry} · ${city}`,
    cta: input.industry === "Ecommerce" ? "Shop Now" : "Learn More",
    variations: [
      { headline: headline2, primaryText: primaryText.replace(headline, headline2) },
      { headline: headline3, primaryText: primaryText.replace(headline, headline3) },
    ],
    complianceScore,
    complianceNotes: `Bradley Filter (mock): Passed ${META_POLICY_CHECKS.length}/${META_POLICY_CHECKS.length} Meta policy checks. Tone aligned to "${tone}".`,
    ragInsights: [
      `High-performing ${input.industry} ads emphasize local proof and a low-friction CTA.`,
      "Meta lead ads convert better when the first line states a concrete benefit within 80 characters.",
      "Retrieved similar campaigns (mock RAG) scored 1.4× higher CTR with urgency + social proof.",
    ],
    recommendations: [
      `Target ages ${input.ageMin || 25}–${input.ageMax || 45} interested in ${input.industry.toLowerCase()}.`,
      "Use a lead form with 3–4 fields max to reduce drop-off.",
      "Pair this copy with a square (1:1) and story (9:16) creative.",
      "Budget tip: start at $20–$40/day and scale winners after 3 days.",
    ],
  };
}

function buildPrimaryText(opts: {
  businessName: string;
  industry: string;
  tone: string;
  style: string;
  audience: string;
  services: string;
  city: string;
}) {
  const openings: Record<string, string> = {
    professional: `Looking for reliable ${opts.industry.toLowerCase()} results in ${opts.city}?`,
    energetic: `Ready to level up? ${opts.businessName} is here for you.`,
    friendly: `Hey ${opts.city}! Meet ${opts.businessName} — your local go-to for ${opts.services}.`,
    luxury: `Experience elevated ${opts.industry.toLowerCase()} at ${opts.businessName}.`,
    bold: `Stop settling. Start with ${opts.businessName}.`,
  };

  const open = openings[opts.tone] || openings.professional;
  return `${open}\n\nWe help ${opts.audience} get real results with ${opts.services}. ${
    opts.style === "expert"
      ? "Backed by proven methods and transparent pricing."
      : opts.style === "inspirational"
        ? "Your next chapter starts with one simple step."
        : "Friendly team. Clear next steps. No stress."
  }\n\nTap Learn More to get started today.`;
}

export async function getOnboardingRecommendations(industry: string, businessName: string) {
  await delay(400);
  return {
    suggestedAudience: `Adults 25–45 interested in ${industry.toLowerCase()} near your service area`,
    suggestedTone: industry === "Luxury" || industry === "Beauty" ? "luxury" : "friendly",
    suggestedBudget: industry === "Real Estate" ? 50 : 25,
    tips: [
      `Lead with a local angle for ${businessName}.`,
      "Collect phone + email on Meta lead forms for WhatsApp nurturing.",
      "Prepare 2–3 creative variations before launch.",
    ],
  };
}

export async function runCampaignDiagnostic(input: {
  industry: string;
  monthlySpend?: number;
  hasCreativeProcess?: boolean;
  tracksLeads?: boolean;
}) {
  await delay(500);
  let score = 55;
  if ((input.monthlySpend || 0) >= 500) score += 10;
  if (input.hasCreativeProcess) score += 15;
  if (input.tracksLeads) score += 15;
  score = Math.min(95, score);

  return {
    score,
    recommendations: [
      score < 70
        ? "Your Meta workflow looks fragmented — automate creative + deployment in one place."
        : "Solid foundation — AI creative testing can unlock more efficient CPA.",
      `Industry focus (${input.industry}): use localized social proof in the first line.`,
      "Add WhatsApp follow-up within 5 minutes of lead capture to lift conversion.",
      "Sync campaign metrics daily and pause underperforming ads after 72 hours.",
    ],
  };
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
