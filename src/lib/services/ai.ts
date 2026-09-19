/**
 * AI service — Module 1 onboarding + Module 2 ads: Gemini primary, Groq secondary.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

export type RagAdExample = {
  headline: string;
  primaryText: string;
  complianceScore: number;
  templateId?: string | null;
};

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
  templateId?: string;
  ragExamples?: RagAdExample[];
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
  policyChecks?: string[];
  source: "gemini" | "groq" | "fallback";
  model?: string;
};

export type OnboardingRecommendations = {
  suggestedAudience: string;
  suggestedTone: string;
  suggestedBudget: number;
  suggestedCategory?: string;
  tips: string[];
  source: "gemini" | "groq" | "fallback";
  model?: string;
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

const ONBOARDING_SYSTEM_PROMPT = `You are Campaignly.AI's onboarding strategist for Meta lead-gen advertisers.
Return JSON only with keys:
- suggestedAudience (string): concrete audience description
- suggestedTone (one of: professional, energetic, friendly, luxury, bold)
- suggestedBudget (number): recommended daily Meta ad budget in USD
- suggestedCategory (string): refined service category
- tips (array of 3-5 short actionable strings for first campaign setup)
Be specific to the industry and business. No markdown.`;

const AD_SYSTEM_PROMPT = `You are Campaignly.AI's Meta advertising creative strategist and Bradley Filter compliance reviewer.
Generate Meta-ready ad copy. Return JSON only with keys:
- headline (string, max ~40 chars preferred)
- primaryText (string, 2-4 short paragraphs, Meta lead-ad friendly)
- description (string, short link description)
- cta (string: Learn More | Shop Now | Book Now | Sign Up | Get Offer | Contact Us)
- variations (array of 2-3 objects with headline + primaryText)
- complianceScore (number 0-100)
- complianceNotes (string summarizing Bradley Filter / Meta policy review)
- policyChecks (array of short strings: each check result)
- ragInsights (array of 2-4 strings: what you learned from retrieved high-performing examples)
- recommendations (array of 3-5 campaign setup tips: targeting, budget, creative formats)
Follow Meta advertising policies: no prohibited personal attributes, no misleading health claims, clear CTA, honest offers.
Match brand tone and communication style. No markdown.`;

function pick<T>(arr: T[], i: number) {
  return arr[i % arr.length];
}

function useMockAi() {
  return process.env.USE_MOCK_AI !== "false";
}

function getGeminiKey() {
  return process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_AI_API_KEY?.trim() || "";
}

function getGroqKey() {
  return process.env.GROQ_API_KEY?.trim() || "";
}

function geminiModel() {
  return process.env.GEMINI_MODEL || "gemini-2.5-flash";
}

function groqModel() {
  return process.env.GROQ_MODEL || "openai/gpt-oss-20b";
}

/** True when live AI is enabled and at least one provider key exists. */
export function isLiveGeminiConfigured() {
  return isLiveOnboardingAiConfigured();
}

export function isLiveOnboardingAiConfigured() {
  return (
    process.env.USE_MOCK_AI === "false" && Boolean(getGeminiKey() || getGroqKey())
  );
}

export function isLiveAdsAiConfigured() {
  return isLiveOnboardingAiConfigured();
}

export type OnboardingRecommendationInput = {
  businessName: string;
  industry: string;
  category?: string | null;
  brandTone?: string | null;
  communicationStyle?: string | null;
  targetAudience?: string | null;
  location?: string | null;
  services?: string | null;
  website?: string | null;
};

function buildOnboardingUserPayload(data: OnboardingRecommendationInput) {
  return JSON.stringify(
    {
      businessName: data.businessName,
      industry: data.industry,
      category: data.category || null,
      brandTone: data.brandTone || null,
      communicationStyle: data.communicationStyle || null,
      targetAudience: data.targetAudience || null,
      location: data.location || null,
      services: data.services || null,
      website: data.website || null,
    },
    null,
    2
  );
}

function parseJsonLoose(raw: string): Record<string, unknown> {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(cleaned) as Record<string, unknown>;
}

function normalizeOnboardingJson(
  raw: string,
  data: OnboardingRecommendationInput,
  source: "gemini" | "groq",
  model: string
): OnboardingRecommendations {
  let parsed: Partial<OnboardingRecommendations>;
  try {
    parsed = parseJsonLoose(raw) as Partial<OnboardingRecommendations>;
  } catch {
    throw new Error(`${source} returned invalid JSON for onboarding recommendations`);
  }

  const tips = Array.isArray(parsed.tips)
    ? parsed.tips.map(String).filter(Boolean).slice(0, 6)
    : [];

  return {
    suggestedAudience:
      String(parsed.suggestedAudience || "").trim() ||
      `Adults interested in ${data.industry.toLowerCase()} near your service area`,
    suggestedTone: String(parsed.suggestedTone || data.brandTone || "friendly"),
    suggestedBudget: Number(parsed.suggestedBudget) > 0 ? Number(parsed.suggestedBudget) : 25,
    suggestedCategory: parsed.suggestedCategory
      ? String(parsed.suggestedCategory)
      : data.category || undefined,
    tips:
      tips.length > 0
        ? tips
        : [
            `Lead with a local angle for ${data.businessName}.`,
            "Collect phone + email on Meta lead forms for WhatsApp nurturing.",
            "Prepare 2–3 creative variations before launch.",
          ],
    source,
    model,
  };
}

async function getRecommendationsFromGemini(
  data: OnboardingRecommendationInput
): Promise<OnboardingRecommendations> {
  const apiKey = getGeminiKey();
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const modelName = geminiModel();
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.4,
      responseMimeType: "application/json",
    },
  });

  const prompt = `${ONBOARDING_SYSTEM_PROMPT}

Business profile:
${buildOnboardingUserPayload(data)}`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text() || "{}";
  return normalizeOnboardingJson(raw, data, "gemini", modelName);
}

async function getRecommendationsFromGroq(
  data: OnboardingRecommendationInput
): Promise<OnboardingRecommendations> {
  const apiKey = getGroqKey();
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  const modelName = groqModel();
  const groq = new Groq({ apiKey });

  const completion = await groq.chat.completions.create({
    model: modelName,
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: ONBOARDING_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Business profile:\n${buildOnboardingUserPayload(data)}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content || "{}";
  return normalizeOnboardingJson(raw, data, "groq", modelName);
}

/**
 * Module 1 FE-7 — live AI recommendations.
 * Primary: Gemini. Secondary: Groq (used when Gemini fails or is missing).
 */
export async function getOnboardingRecommendations(
  input: OnboardingRecommendationInput | string,
  businessNameArg?: string
): Promise<OnboardingRecommendations> {
  const data: OnboardingRecommendationInput =
    typeof input === "string"
      ? { industry: input, businessName: businessNameArg || "Business" }
      : input;

  const allowMock = useMockAi();
  const hasGemini = Boolean(getGeminiKey());
  const hasGroq = Boolean(getGroqKey());

  if (allowMock) {
    return fallbackOnboardingRecommendations(data);
  }

  if (!hasGemini && !hasGroq) {
    throw new Error(
      "No live AI key configured. Set GEMINI_API_KEY and/or GROQ_API_KEY with USE_MOCK_AI=false."
    );
  }

  const errors: string[] = [];

  if (hasGemini) {
    try {
      return await getRecommendationsFromGemini(data);
    } catch (err) {
      errors.push(`Gemini: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (hasGroq) {
    try {
      return await getRecommendationsFromGroq(data);
    } catch (err) {
      errors.push(`Groq: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  throw new Error(
    `All AI providers failed for onboarding recommendations. ${errors.join(" | ")}`
  );
}

function fallbackOnboardingRecommendations(
  data: OnboardingRecommendationInput
): OnboardingRecommendations {
  return {
    suggestedAudience: `Adults 25–45 interested in ${data.industry.toLowerCase()} near your service area`,
    suggestedTone:
      data.industry === "Beauty" || data.brandTone === "luxury" ? "luxury" : "friendly",
    suggestedBudget: data.industry === "Real Estate" ? 50 : 25,
    suggestedCategory: data.category || undefined,
    tips: [
      `Lead with a local angle for ${data.businessName}.`,
      "Collect phone + email on Meta lead forms for WhatsApp nurturing.",
      "Prepare 2–3 creative variations before launch.",
    ],
    source: "fallback",
  };
}

function buildAdUserPayload(input: AdGenerationInput) {
  return JSON.stringify(
    {
      business: {
        businessName: input.businessName,
        industry: input.industry,
        brandTone: input.brandTone,
        communicationStyle: input.communicationStyle,
        targetAudience: input.targetAudience || null,
        services: input.services || null,
        location: input.location || null,
      },
      campaign: {
        objective: input.objective || "LEAD_GENERATION",
        ageMin: input.ageMin ?? 25,
        ageMax: input.ageMax ?? 45,
        gender: input.gender || "all",
        templateId: input.templateId || null,
      },
      metaPolicyChecklist: META_POLICY_CHECKS,
      retrievedHighPerformingAds: input.ragExamples || [],
    },
    null,
    2
  );
}

function normalizeGeneratedAd(
  raw: string,
  input: AdGenerationInput,
  source: "gemini" | "groq",
  model: string
): GeneratedAd {
  let parsed: Record<string, unknown>;
  try {
    parsed = parseJsonLoose(raw);
  } catch {
    throw new Error(`${source} returned invalid JSON for ad generation`);
  }

  const city = input.location?.split(",")[0]?.trim() || "your city";
  const variationsRaw = Array.isArray(parsed.variations) ? parsed.variations : [];
  const variations = variationsRaw
    .map((v) => {
      const row = v as { headline?: string; primaryText?: string };
      return {
        headline: String(row.headline || "").trim(),
        primaryText: String(row.primaryText || "").trim(),
      };
    })
    .filter((v) => v.headline && v.primaryText)
    .slice(0, 4);

  const headline =
    String(parsed.headline || "").trim() ||
    `${input.businessName} — ${input.industry} in ${city}`;
  const primaryText =
    String(parsed.primaryText || "").trim() ||
    `Discover ${input.businessName}. Tap Learn More to get started.`;

  const score = Number(parsed.complianceScore);
  const complianceScore =
    Number.isFinite(score) && score >= 0 && score <= 100 ? Math.round(score) : 85;

  return {
    headline,
    primaryText,
    description:
      String(parsed.description || "").trim() ||
      `${input.businessName} · ${input.industry} · ${city}`,
    cta:
      String(parsed.cta || "").trim() ||
      (input.industry === "Ecommerce" ? "Shop Now" : "Learn More"),
    variations:
      variations.length >= 2
        ? variations
        : [
            { headline: `${headline} — Option B`, primaryText },
            { headline: `${headline} — Option C`, primaryText },
          ],
    complianceScore,
    complianceNotes:
      String(parsed.complianceNotes || "").trim() ||
      `Bradley Filter: Reviewed against Meta advertising policies. Tone aligned to "${input.brandTone}".`,
    ragInsights: Array.isArray(parsed.ragInsights)
      ? parsed.ragInsights.map(String).filter(Boolean).slice(0, 6)
      : [
          `Retrieved ${(input.ragExamples || []).length} high-performing ads for context.`,
          `Industry focus: ${input.industry} lead-gen patterns favor local proof + clear CTA.`,
        ],
    recommendations: Array.isArray(parsed.recommendations)
      ? parsed.recommendations.map(String).filter(Boolean).slice(0, 6)
      : [
          `Target ages ${input.ageMin || 25}–${input.ageMax || 45}.`,
          "Use a lead form with 3–4 fields max.",
          "Test square and story placements.",
        ],
    policyChecks: Array.isArray(parsed.policyChecks)
      ? parsed.policyChecks.map(String).filter(Boolean).slice(0, 8)
      : META_POLICY_CHECKS,
    source,
    model,
  };
}

async function generateAdFromGemini(input: AdGenerationInput): Promise<GeneratedAd> {
  const apiKey = getGeminiKey();
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const modelName = geminiModel();
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.5,
      responseMimeType: "application/json",
    },
  });

  const prompt = `${AD_SYSTEM_PROMPT}

Brief:
${buildAdUserPayload(input)}`;

  const result = await model.generateContent(prompt);
  return normalizeGeneratedAd(result.response.text() || "{}", input, "gemini", modelName);
}

async function generateAdFromGroq(input: AdGenerationInput): Promise<GeneratedAd> {
  const apiKey = getGroqKey();
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  const modelName = groqModel();
  const groq = new Groq({ apiKey });
  const completion = await groq.chat.completions.create({
    model: modelName,
    temperature: 0.5,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: AD_SYSTEM_PROMPT },
      { role: "user", content: `Brief:\n${buildAdUserPayload(input)}` },
    ],
  });

  return normalizeGeneratedAd(
    completion.choices[0]?.message?.content || "{}",
    input,
    "groq",
    modelName
  );
}

function mockGenerateAdContent(input: AdGenerationInput): GeneratedAd {
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
  const ragCount = input.ragExamples?.length || 0;

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
      ragCount
        ? `Retrieved ${ragCount} high-compliance ads from the local library for style cues.`
        : `High-performing ${input.industry} ads emphasize local proof and a low-friction CTA.`,
      "Meta lead ads convert better when the first line states a concrete benefit within 80 characters.",
      "Template " + (input.templateId || "default") + " applied to structure the offer.",
    ],
    recommendations: [
      `Target ages ${input.ageMin || 25}–${input.ageMax || 45} interested in ${input.industry.toLowerCase()}.`,
      "Use a lead form with 3–4 fields max to reduce drop-off.",
      "Pair this copy with a square (1:1) and story (9:16) creative.",
      "Budget tip: start at $20–$40/day and scale winners after 3 days.",
    ],
    policyChecks: META_POLICY_CHECKS,
    source: "fallback",
  };
}

/**
 * Module 2 — AI ad generation.
 * Primary: Gemini. Secondary: Groq. Mock only when USE_MOCK_AI is not false.
 */
export async function generateAdContent(input: AdGenerationInput): Promise<GeneratedAd> {
  if (useMockAi()) {
    await delay(400);
    return mockGenerateAdContent(input);
  }

  const hasGemini = Boolean(getGeminiKey());
  const hasGroq = Boolean(getGroqKey());
  if (!hasGemini && !hasGroq) {
    throw new Error(
      "No live AI key configured. Set GEMINI_API_KEY and/or GROQ_API_KEY with USE_MOCK_AI=false."
    );
  }

  const errors: string[] = [];

  if (hasGemini) {
    try {
      return await generateAdFromGemini(input);
    } catch (err) {
      errors.push(`Gemini: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (hasGroq) {
    try {
      return await generateAdFromGroq(input);
    } catch (err) {
      errors.push(`Groq: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  throw new Error(`All AI providers failed for ad generation. ${errors.join(" | ")}`);
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
