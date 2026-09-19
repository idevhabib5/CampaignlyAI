/**
 * WhatsApp Lead Nurturing — Intent & Sentiment Scoring (MOCK AI)
 * Scope Module 6 FE-3 / FE-4 / FE-7 / FE-8:
 * Score leads using sentiment and intent, automate follow-up timing
 * and escalation, notify when conversion-ready, store scores.
 *
 * Production: replace detectIntent/detectSentiment with an LLM classifier.
 */

export type Intent =
  | "purchase_ready"
  | "pricing"
  | "scheduling"
  | "information"
  | "objection"
  | "rejection"
  | "unknown";

export type Sentiment = "positive" | "neutral" | "negative";

export type BehavioralSignal = {
  id: string;
  label: string;
  weight: number;
};

export type IntentScoreResult = {
  intent: Intent;
  intentLabel: string;
  intentConfidence: number;
  sentiment: Sentiment;
  sentimentScore: number; // -100..100
  behavioralSignals: BehavioralSignal[];
  leadScoreDelta: number;
  leadScore: number;
  readyForConversion: boolean;
  escalateToOwner: boolean;
  followUpDelayHours: number;
  suggestedStatus: string;
  content: string;
  scoringBreakdown: {
    base: number;
    intentContribution: number;
    sentimentContribution: number;
    signalContribution: number;
    previousScore: number;
  };
};

const INTENT_PATTERNS: Array<{
  intent: Intent;
  label: string;
  patterns: RegExp[];
  confidence: number;
  scoreWeight: number;
}> = [
  {
    intent: "rejection",
    label: "Rejection / opt-out",
    confidence: 92,
    scoreWeight: -35,
    patterns: [
      /\b(stop|unsubscribe|remove me|don't contact|do not contact|leave me alone)\b/i,
      /\b(not interested|no thanks|no thank you|never mind)\b/i,
      /\b(wrong number|don't text)\b/i,
    ],
  },
  {
    intent: "purchase_ready",
    label: "Purchase / book intent",
    confidence: 90,
    scoreWeight: 28,
    patterns: [
      /\b(i('d| would)? like to (book|join|sign up|enroll|buy|purchase))\b/i,
      /\b(can i (book|join|sign up)|ready to (book|join|start|sign up))\b/i,
      /\b(let'?s (do|book) it|sign me up|i'?m in|count me in)\b/i,
      /\b(yes[,.]?\s*(i('m| am)?\s*)?(interested|ready).*(book|call|start))\b/i,
      /\b(want to (book|get started|join|sign up))\b/i,
    ],
  },
  {
    intent: "pricing",
    label: "Pricing enquiry",
    confidence: 88,
    scoreWeight: 14,
    patterns: [
      /\b(price|pricing|cost|how much|fees?|rates?|packages?|packages?)\b/i,
      /\b(what do you charge|monthly fee|starter package)\b/i,
    ],
  },
  {
    intent: "scheduling",
    label: "Scheduling / availability",
    confidence: 86,
    scoreWeight: 16,
    patterns: [
      /\b(when (are you|is|can)|available|availability|openings?)\b/i,
      /\b(this (week|weekend)|tomorrow|tonight|schedule|appointment|slot)\b/i,
      /\b(what time|can we (talk|meet|call))\b/i,
    ],
  },
  {
    intent: "objection",
    label: "Objection / hesitation",
    confidence: 80,
    scoreWeight: -8,
    patterns: [
      /\b(busy|maybe later|not sure|thinking about it|still exploring|too expensive|can'?t afford)\b/i,
      /\b(need to (think|check|ask)|call me later|not now)\b/i,
    ],
  },
  {
    intent: "information",
    label: "Information seeking",
    confidence: 75,
    scoreWeight: 8,
    patterns: [
      /\b(tell me more|what (do you|is|are)|how does|details|info|information|options)\b/i,
      /\b(looking for|exploring|curious|interested in learning)\b/i,
    ],
  },
];

const POSITIVE_WORDS = [
  "yes",
  "yeah",
  "yep",
  "sure",
  "great",
  "awesome",
  "perfect",
  "love",
  "excited",
  "interested",
  "thanks",
  "thank you",
  "sounds good",
  "please",
];
const NEGATIVE_WORDS = [
  "no",
  "nope",
  "nah",
  "hate",
  "awful",
  "terrible",
  "annoyed",
  "spam",
  "stop",
  "never",
  "waste",
];

const INTENT_LABELS: Record<Intent, string> = {
  purchase_ready: "Purchase / book intent",
  pricing: "Pricing enquiry",
  scheduling: "Scheduling / availability",
  information: "Information seeking",
  objection: "Objection / hesitation",
  rejection: "Rejection / opt-out",
  unknown: "Unclear intent",
};

function detectIntent(message: string): {
  intent: Intent;
  intentLabel: string;
  intentConfidence: number;
  scoreWeight: number;
} {
  for (const rule of INTENT_PATTERNS) {
    if (rule.patterns.some((p) => p.test(message))) {
      return {
        intent: rule.intent,
        intentLabel: rule.label,
        intentConfidence: rule.confidence,
        scoreWeight: rule.scoreWeight,
      };
    }
  }
  return {
    intent: "unknown",
    intentLabel: INTENT_LABELS.unknown,
    intentConfidence: 40,
    scoreWeight: 3,
  };
}

function detectSentiment(message: string): {
  sentiment: Sentiment;
  sentimentScore: number;
} {
  const lower = message.toLowerCase();
  let score = 0;
  for (const w of POSITIVE_WORDS) {
    if (new RegExp(`\\b${escapeRegex(w)}\\b`, "i").test(lower)) score += 18;
  }
  for (const w of NEGATIVE_WORDS) {
    if (new RegExp(`\\b${escapeRegex(w)}\\b`, "i").test(lower)) score -= 22;
  }
  // Soften bare "no" inside longer clarifying sentences unless rejection intent
  if (/\b(no problem|no worries|not a problem)\b/i.test(lower)) score += 20;

  score = Math.max(-100, Math.min(100, score));
  const sentiment: Sentiment = score >= 20 ? "positive" : score <= -20 ? "negative" : "neutral";
  return { sentiment, sentimentScore: score };
}

function collectBehavioralSignals(
  message: string,
  intent: Intent,
  sentiment: Sentiment,
  messageCount: number
): BehavioralSignal[] {
  const signals: BehavioralSignal[] = [];
  const words = message.trim().split(/\s+/).filter(Boolean).length;

  if (intent === "purchase_ready") {
    signals.push({ id: "buy_signal", label: "Explicit booking/purchase language", weight: 20 });
  }
  if (intent === "pricing" || intent === "scheduling") {
    signals.push({ id: "commercial_enquiry", label: "Commercial enquiry (price/time)", weight: 10 });
  }
  if (intent === "rejection") {
    signals.push({ id: "opt_out", label: "Opt-out or hard rejection", weight: -25 });
  }
  if (sentiment === "positive") {
    signals.push({ id: "pos_tone", label: "Positive sentiment markers", weight: 8 });
  }
  if (sentiment === "negative") {
    signals.push({ id: "neg_tone", label: "Negative sentiment markers", weight: -10 });
  }
  if (words >= 12) {
    signals.push({ id: "detailed_reply", label: "Detailed reply (high engagement)", weight: 6 });
  } else if (words > 0 && words <= 3) {
    signals.push({ id: "short_reply", label: "Very short reply", weight: -2 });
  }
  if (/\?/.test(message)) {
    signals.push({ id: "asked_question", label: "Asked a question (active engagement)", weight: 5 });
  }
  if (messageCount >= 4) {
    signals.push({ id: "ongoing_thread", label: "Ongoing conversation thread", weight: 4 });
  }
  if (/\b(today|asap|now|immediately)\b/i.test(message)) {
    signals.push({ id: "urgency", label: "Urgency language", weight: 7 });
  }

  return signals;
}

function buildReply(input: {
  intent: Intent;
  sentiment: Sentiment;
  readyForConversion: boolean;
}): string {
  if (input.intent === "rejection") {
    return "Understood — I’ll stop follow-ups. You’re welcome to message anytime if things change.";
  }
  if (input.readyForConversion) {
    return "Perfect — you look conversion-ready. I’ve notified the team to take over. What time works best for a quick call today?";
  }
  switch (input.intent) {
    case "purchase_ready":
      return "Great — I can help you get started. Prefer a quick call, or should I send the next steps here on WhatsApp?";
    case "pricing":
      return "Happy to share pricing. Most clients start with our starter package. Want a short breakdown here, or a 10-minute call?";
    case "scheduling":
      return "We have openings this week. Weekday evening or weekend morning — which works better?";
    case "objection":
      return "Totally fair. No pressure — would a one-line summary of options help, or should I check back in a few days?";
    case "information":
      return "Glad you asked. Quick question so I can personalize this: are you looking to start this month, or still comparing options?";
    default:
      return "Thanks for the message! Are you looking to book soon, or still exploring what’s available?";
  }
}

/**
 * Score an inbound WhatsApp message using intent + sentiment + behavioral signals.
 * Scope FE-3: Score leads using sentiment and intent.
 * Scope FE-4: Automate follow-up timing and escalation decisions.
 */
export function scoreInboundMessage(
  message: string,
  currentScore: number,
  options?: { priorMessageCount?: number }
): IntentScoreResult {
  const text = message.trim();
  const intentHit = detectIntent(text);
  const { sentiment, sentimentScore } = detectSentiment(text);
  const behavioralSignals = collectBehavioralSignals(
    text,
    intentHit.intent,
    sentiment,
    options?.priorMessageCount ?? 1
  );

  const intentContribution = intentHit.scoreWeight;
  const sentimentContribution = Math.round(sentimentScore * 0.12);
  const signalContribution = behavioralSignals.reduce((sum, s) => sum + s.weight, 0);

  // Soften contradictory cases: "not interested" shouldn't also get purchase weight
  let delta = intentContribution + sentimentContribution + Math.round(signalContribution * 0.35);
  if (intentHit.intent === "rejection") {
    delta = Math.min(delta, -25);
  }
  if (intentHit.intent === "purchase_ready" && sentiment === "positive") {
    delta = Math.max(delta, 22);
  }

  delta = Math.max(-40, Math.min(35, delta));
  const leadScore = Math.max(0, Math.min(100, currentScore + delta));

  const readyForConversion =
    leadScore >= 75 &&
    (intentHit.intent === "purchase_ready" ||
      (intentHit.intent === "scheduling" && sentiment === "positive" && leadScore >= 80) ||
      (intentHit.intent === "pricing" && sentiment === "positive" && leadScore >= 85));

  const escalateToOwner =
    readyForConversion ||
    intentHit.intent === "rejection" ||
    (leadScore >= 70 && intentHit.intent === "purchase_ready");

  // FE-4 follow-up timing
  let followUpDelayHours = 24;
  if (intentHit.intent === "rejection") followUpDelayHours = 0; // stop
  else if (readyForConversion) followUpDelayHours = 0; // escalate now
  else if (intentHit.intent === "purchase_ready" || intentHit.intent === "scheduling")
    followUpDelayHours = 2;
  else if (intentHit.intent === "pricing") followUpDelayHours = 4;
  else if (intentHit.intent === "objection") followUpDelayHours = 72;
  else if (intentHit.intent === "information") followUpDelayHours = 24;
  else followUpDelayHours = 36;

  const suggestedStatus = readyForConversion
    ? "CONVERSION_READY"
    : intentHit.intent === "rejection"
      ? "LOST"
      : leadScore >= 55
        ? "QUALIFIED"
        : leadScore >= 25
          ? "NURTURING"
          : "CONTACTED";

  const content = buildReply({
    intent: intentHit.intent,
    sentiment,
    readyForConversion,
  });

  return {
    intent: intentHit.intent,
    intentLabel: intentHit.intentLabel,
    intentConfidence: intentHit.intentConfidence,
    sentiment,
    sentimentScore,
    behavioralSignals,
    leadScoreDelta: delta,
    leadScore,
    readyForConversion,
    escalateToOwner,
    followUpDelayHours,
    suggestedStatus,
    content,
    scoringBreakdown: {
      base: 0,
      intentContribution,
      sentimentContribution,
      signalContribution: Math.round(signalContribution * 0.35),
      previousScore: currentScore,
    },
  };
}

export function initialOutreach(leadName: string, businessName: string, industry: string) {
  const first = leadName.split(" ")[0] || "there";
  return `Hi ${first}! Thanks for your interest in ${businessName}. I'm the assistant for our ${industry.toLowerCase()} team — happy to answer questions or help you book. What are you looking for right now?`;
}

export async function processScheduledFollowUps() {
  return {
    processed: 0,
    mock: true,
    note: "BullMQ/Redis follow-up jobs mocked — timing rules live in scoreInboundMessage.followUpDelayHours",
  };
}

/** Preset inbound samples for demo (covers major intents). */
export const DEMO_INBOUND_SAMPLES = [
  "Yes I'm interested, can I book a call today?",
  "What's the price for a starter package?",
  "When are you available this week?",
  "Still thinking about it, maybe later.",
  "Tell me more about what you offer.",
  "Please stop messaging me, not interested.",
];

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
