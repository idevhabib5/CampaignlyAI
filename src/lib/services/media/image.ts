import sharp, { type OverlayOptions } from "sharp";
import { putObject, makeStorageKey } from "./storage";

export type BrandKit = {
  brandColors?: string | null;
  logoUrl?: string | null;
};

export type Placement = { id: string; name: string; width: number; height: number };

export function getPlacementSizes(): Placement[] {
  return [
    { id: "feed_square", name: "Feed square", width: 1080, height: 1080 },
    { id: "story_reels", name: "Story / Reels", width: 1080, height: 1920 },
    { id: "landscape", name: "Landscape link", width: 1200, height: 628 },
  ];
}

function parseAccent(brandColors?: string | null) {
  if (!brandColors) return "#0f766e";
  const hex = brandColors.match(/#([0-9a-fA-F]{3,8})/);
  return hex ? hex[0] : "#0f766e";
}

async function loadLogoOverlay(logoUrl?: string | null): Promise<Buffer | null> {
  if (!logoUrl) return null;
  try {
    const res = await fetch(logoUrl);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return sharp(buf).resize(160, 160, { fit: "inside" }).png().toBuffer();
  } catch {
    return null;
  }
}

export async function resizeImage(input: {
  buffer: Buffer;
  width: number;
  height: number;
  userId: string;
  filename: string;
}): Promise<{ buffer: Buffer; width: number; height: number; url: string; storageKey: string }> {
  const out = await sharp(input.buffer)
    .resize(input.width, input.height, { fit: "cover", position: "centre" })
    .jpeg({ quality: 88 })
    .toBuffer();
  const key = makeStorageKey(input.userId, `resize-${input.width}x${input.height}-${input.filename}`);
  const stored = await putObject({ key, body: out, contentType: "image/jpeg" });
  return { buffer: out, width: input.width, height: input.height, url: stored.url, storageKey: stored.storageKey };
}

export async function enhanceImage(input: {
  buffer: Buffer;
  userId: string;
  filename: string;
}): Promise<{ buffer: Buffer; width: number; height: number; url: string; storageKey: string }> {
  const meta = await sharp(input.buffer).metadata();
  const out = await sharp(input.buffer)
    .normalize()
    .sharpen({ sigma: 0.8 })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
  const key = makeStorageKey(input.userId, `enhance-${input.filename}`);
  const stored = await putObject({ key, body: out, contentType: "image/jpeg" });
  return {
    buffer: out,
    width: meta.width || 1080,
    height: meta.height || 1080,
    url: stored.url,
    storageKey: stored.storageKey,
  };
}

export async function brandImage(input: {
  buffer: Buffer;
  userId: string;
  filename: string;
  brand: BrandKit;
}): Promise<{ buffer: Buffer; width: number; height: number; url: string; storageKey: string }> {
  const base = sharp(input.buffer);
  const meta = await base.metadata();
  const width = meta.width || 1080;
  const height = meta.height || 1080;
  const accent = parseAccent(input.brand.brandColors);
  const barHeight = Math.max(24, Math.round(height * 0.06));
  const barSvg = Buffer.from(
    `<svg width="${width}" height="${barHeight}"><rect width="100%" height="100%" fill="${accent}"/></svg>`
  );
  const composites: OverlayOptions[] = [
    { input: barSvg, top: height - barHeight, left: 0 },
  ];
  const logo = await loadLogoOverlay(input.brand.logoUrl);
  if (logo) {
    composites.push({ input: logo, top: 24, left: 24 });
  }
  const out = await base.composite(composites).jpeg({ quality: 90 }).toBuffer();
  const key = makeStorageKey(input.userId, `brand-${input.filename}`);
  const stored = await putObject({ key, body: out, contentType: "image/jpeg" });
  return { buffer: out, width, height, url: stored.url, storageKey: stored.storageKey };
}

export async function cropImage(input: {
  buffer: Buffer;
  userId: string;
  filename: string;
  crop: { x: number; y: number; w: number; h: number };
}): Promise<{ buffer: Buffer; width: number; height: number; url: string; storageKey: string }> {
  const meta = await sharp(input.buffer).metadata();
  const iw = meta.width || 1080;
  const ih = meta.height || 1080;
  // crop values are ratios 0–1 from the canvas UI
  const left = Math.max(0, Math.round(input.crop.x * iw));
  const top = Math.max(0, Math.round(input.crop.y * ih));
  const width = Math.max(1, Math.min(iw - left, Math.round(input.crop.w * iw)));
  const height = Math.max(1, Math.min(ih - top, Math.round(input.crop.h * ih)));
  const out = await sharp(input.buffer)
    .extract({ left, top, width, height })
    .jpeg({ quality: 90 })
    .toBuffer();
  const key = makeStorageKey(input.userId, `crop-${input.filename}`);
  const stored = await putObject({ key, body: out, contentType: "image/jpeg" });
  return { buffer: out, width, height, url: stored.url, storageKey: stored.storageKey };
}
