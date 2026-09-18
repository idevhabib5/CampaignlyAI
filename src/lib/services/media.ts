/**
 * Media / S3 storage (MOCK)
 * Scope Module 3 — upload, resize metadata, brand apply flags.
 * Production would use AWS S3 SDK v3.
 */

export type MockUpload = {
  filename: string;
  mimeType: string;
  mediaType: "image" | "video";
  url: string;
  width: number;
  height: number;
  durationSec?: number;
  captions?: string;
  brandApplied: boolean;
};

export async function uploadMediaMock(input: {
  filename: string;
  mimeType: string;
  applyBrand?: boolean;
  generateCaptions?: boolean;
}): Promise<MockUpload> {
  await delay(500);
  const isVideo = input.mimeType.startsWith("video") || /\.(mp4|mov|webm)$/i.test(input.filename);
  const id = Date.now().toString(36);

  return {
    filename: input.filename,
    mimeType: input.mimeType || (isVideo ? "video/mp4" : "image/jpeg"),
    mediaType: isVideo ? "video" : "image",
    url: isVideo
      ? `https://placehold.co/1080x1920/0f766e/ffffff?text=${encodeURIComponent("Video+" + id)}`
      : `https://placehold.co/1080x1080/134e4a/ecfdf5?text=${encodeURIComponent(input.filename.slice(0, 18))}`,
    width: isVideo ? 1080 : 1080,
    height: isVideo ? 1920 : 1080,
    durationSec: isVideo ? 15 : undefined,
    captions: input.generateCaptions
      ? "Auto captions (mock): Discover more · Book today · Limited spots"
      : undefined,
    brandApplied: Boolean(input.applyBrand),
  };
}

export function getPlacementSizes() {
  return [
    { name: "Feed square", width: 1080, height: 1080 },
    { name: "Story / Reels", width: 1080, height: 1920 },
    { name: "Landscape link", width: 1200, height: 628 },
  ];
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
