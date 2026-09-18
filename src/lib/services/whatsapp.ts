/**
 * WhatsApp Lead Nurturing Assistant (MOCK)
 * Scope Module 6 — AI conversations, scoring, conversion-ready alerts.
 */

export type NurtureReply = {
  content: string;
  leadScoreDelta: number;
  sentiment: "positive" | "neutral" | "negative";
  readyForConversion: boolean;
  suggestedStatus: string;
};

const POSITIVE_SIGNALS = ["yes", "interested", "book", "price", "cost", "when", "available", "sign up", "join"];
const NEGATIVE_SIGNALS = ["no", "stop", "unsubscribe", "not interested", "busy"];

export function scoreInboundMessage(message: string, currentScore: number): NurtureReply {
  const lower = message.toLowerCase();
  let delta = 5;
  let sentiment: NurtureReply["sentiment"] = "neutral";

  if (POSITIVE_SIGNALS.some((s) => lower.includes(s))) {
    delta = 15;
    sentiment = "positive";
  }
  if (NEGATIVE_SIGNALS.some((s) => lower.includes(s))) {
    delta = -20;
    sentiment = "negative";
  }

  const leadScore = Math.max(0, Math.min(100, currentScore + delta));
  const readyForConversion = leadScore >= 75 && sentiment === "positive";

  let content: string;
  if (sentiment === "negative") {
    content =
      "Thanks for letting us know — I'll pause follow-ups for now. Reply anytime if you'd like to reconnect.";
  } else if (readyForConversion) {
    content =
      "Great — you're a strong fit! I've notified the team. Someone will reach out shortly to help you get started. Any preferred time today?";
  } else if (lower.includes("price") || lower.includes("cost")) {
    content =
      "Happy to help with pricing! Most clients start with our starter package. Would you like a quick call, or should I send a simple breakdown here?";
  } else if (lower.includes("when") || lower.includes("available")) {
    content =
      "We have openings this week. What day works better for you — weekday evening or weekend morning?";
  } else {
    content =
      "Thanks for your message! Quick question so I can help: are you looking to get started this month, or still exploring options?";
  }

  return {
    content,
    leadScoreDelta: delta,
    sentiment,
    readyForConversion,
    suggestedStatus: readyForConversion
      ? "CONVERSION_READY"
      : sentiment === "negative"
        ? "LOST"
        : leadScore >= 50
          ? "QUALIFIED"
          : "NURTURING",
  };
}

export function initialOutreach(leadName: string, businessName: string, industry: string) {
  const first = leadName.split(" ")[0] || "there";
  return `Hi ${first}! Thanks for your interest in ${businessName}. I'm the assistant for our ${industry.toLowerCase()} team — happy to answer questions or help you book. What are you looking for right now?`;
}

export async function processScheduledFollowUps() {
  // Mock background job tick (BullMQ/Redis in production)
  return { processed: 0, mock: true, note: "BullMQ/Redis jobs mocked for POC" };
}
