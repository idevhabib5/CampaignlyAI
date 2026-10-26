import OpenAI, { toFile } from "openai";
import { putObject, makeStorageKey } from "./storage";

export type CaptionResult = {
  text: string;
  vtt?: string;
  captionTrackUrl?: string;
  provider: "whisper" | "gemini" | "groq" | "mock";
};

function isWhisperConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function buildVttFromText(text: string): string {
  const lines = text
    .split(/\n|(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
  if (lines.length === 0) {
    return "WEBVTT\n\n00:00:00.000 --> 00:00:04.000\nAdd your caption text\n";
  }
  let cursor = 0;
  const chunks = lines.map((line, i) => {
    const start = cursor;
    const end = cursor + 3;
    cursor = end;
    const fmt = (s: number) => {
      const h = String(Math.floor(s / 3600)).padStart(2, "0");
      const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
      const sec = String(Math.floor(s % 60)).padStart(2, "0");
      return `${h}:${m}:${sec}.000`;
    };
    return `${i + 1}\n${fmt(start)} --> ${fmt(end)}\n${line}\n`;
  });
  return `WEBVTT\n\n${chunks.join("\n")}`;
}

function toVtt(text: string): string {
  return buildVttFromText(text);
}

async function captionWithWhisper(buffer: Buffer, filename: string): Promise<CaptionResult> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const file = await toFile(buffer, filename.endsWith(".mp4") || filename.endsWith(".webm") || filename.endsWith(".mp3") || filename.endsWith(".wav") ? filename : `${filename}.mp4`);
  const transcription = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    response_format: "verbose_json",
  });
  const text = transcription.text?.trim() || "No speech detected.";
  const vtt = toVtt(text);
  return { text, vtt, provider: "whisper" };
}

async function captionWithLlmFallback(context: {
  filename: string;
  industry?: string | null;
  businessName?: string | null;
}): Promise<CaptionResult> {
  const { getOnboardingRecommendations, isLiveOnboardingAiConfigured } = await import("../ai");
  if (isLiveOnboardingAiConfigured()) {
    try {
      const rec = await getOnboardingRecommendations({
        businessName: context.businessName || "Business",
        industry: context.industry || "local services",
        brandTone: "energetic",
        communicationStyle: "short promotional captions for Meta ads",
        services: `Generate 3 short spoken-style caption lines for a promo video named ${context.filename}`,
      });
      const text = (rec.tips || []).slice(0, 3).join(". ") || rec.suggestedAudience;
      return {
        text: text || "Discover more. Book today. Limited spots available.",
        vtt: toVtt(text || "Discover more. Book today."),
        provider: rec.source === "groq" ? "groq" : rec.source === "gemini" ? "gemini" : "mock",
      };
    } catch {
      /* fall through */
    }
  }
  return {
    text: "Auto captions (demo): Discover more · Book today · Limited spots",
    vtt: toVtt("Discover more. Book today. Limited spots."),
    provider: "mock",
  };
}

export async function generateCaptions(input: {
  buffer: Buffer;
  filename: string;
  userId: string;
  mediaType: "image" | "video";
  industry?: string | null;
  businessName?: string | null;
}): Promise<CaptionResult> {
  let result: CaptionResult;
  if (input.mediaType === "video" && isWhisperConfigured()) {
    try {
      result = await captionWithWhisper(input.buffer, input.filename);
    } catch {
      result = await captionWithLlmFallback(input);
    }
  } else {
    result = await captionWithLlmFallback(input);
  }

  if (result.vtt) {
    const key = makeStorageKey(input.userId, `captions-${input.filename}.vtt`);
    const stored = await putObject({
      key,
      body: Buffer.from(result.vtt, "utf8"),
      contentType: "text/vtt",
    });
    result.captionTrackUrl = stored.url;
  }
  return result;
}

export function isWhisperLive() {
  return isWhisperConfigured();
}

/** Persist custom or AI caption text as a VTT captions track for the video player. */
export async function saveCaptionTrack(input: {
  userId: string;
  filename: string;
  text: string;
}): Promise<{ captions: string; captionTrackUrl: string; notes: string }> {
  const captions = input.text.trim();
  if (!captions) throw new Error("Caption text is empty.");
  const vtt = buildVttFromText(captions);
  const key = makeStorageKey(input.userId, `captions-${input.filename}.vtt`);
  const stored = await putObject({
    key,
    body: Buffer.from(vtt, "utf8"),
    contentType: "text/vtt",
  });
  return {
    captions,
    captionTrackUrl: stored.url,
    notes: "Captions saved as WebVTT track",
  };
}

/** @deprecated use saveCaptionTrack */
export const saveSubtitleTrack = saveCaptionTrack;
