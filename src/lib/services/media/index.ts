/**
 * Module 3 — AI Media Editing orchestration
 * Storage: S3 or local public/uploads
 * Images: sharp | Video: fluent-ffmpeg | Captions: Whisper (+ Gemini/Groq fallback)
 */

import { putObject, makeStorageKey, readObjectBuffer, deleteObject, getStorageMode, repairLocalAssetUrl } from "./storage";
import {
  getPlacementSizes,
  resizeImage,
  enhanceImage,
  brandImage,
  cropImage,
  type BrandKit,
  type Placement,
} from "./image";
import {
  isFfmpegAvailable,
  trimVideo,
  resizeVideo,
  brandVideo,
  createSnippet,
} from "./video";
import { generateCaptions, isWhisperLive, saveCaptionTrack } from "./captions";

export {
  getPlacementSizes,
  getStorageMode,
  isWhisperLive,
  isFfmpegAvailable,
  deleteObject,
  repairLocalAssetUrl,
};
export type { BrandKit, Placement };

export type MediaPipelineMeta = {
  storageMode: "s3" | "local";
  whisperConfigured: boolean;
  ffmpegAvailable: boolean;
};

export async function getMediaPipelineMeta(): Promise<MediaPipelineMeta> {
  return {
    storageMode: getStorageMode(),
    whisperConfigured: isWhisperLive(),
    ffmpegAvailable: await isFfmpegAvailable(),
  };
}

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
]);

export function assertAllowedMime(mimeType: string) {
  if (!ALLOWED_MIME.has(mimeType)) {
    throw new Error(`Unsupported media type: ${mimeType}. Allowed: JPEG, PNG, WebP, MP4, WebM.`);
  }
}

export async function uploadMediaFile(input: {
  userId: string;
  filename: string;
  mimeType: string;
  buffer: Buffer;
}): Promise<{
  filename: string;
  mimeType: string;
  mediaType: "image" | "video";
  url: string;
  storageKey: string;
  width: number;
  height: number;
  durationSec?: number;
  source: string;
  notes: string;
}> {
  assertAllowedMime(input.mimeType);
  if (input.buffer.length > 25 * 1024 * 1024) {
    throw new Error("File too large (max 25MB).");
  }
  const isVideo = input.mimeType.startsWith("video");
  const key = makeStorageKey(input.userId, input.filename);
  const stored = await putObject({
    key,
    body: input.buffer,
    contentType: input.mimeType,
  });

  let width = 1080;
  let height = isVideo ? 1920 : 1080;
  if (!isVideo) {
    try {
      const sharp = (await import("sharp")).default;
      const meta = await sharp(input.buffer).metadata();
      width = meta.width || width;
      height = meta.height || height;
    } catch {
      /* keep defaults */
    }
  }

  return {
    filename: input.filename,
    mimeType: input.mimeType,
    mediaType: isVideo ? "video" : "image",
    url: stored.url,
    storageKey: stored.storageKey,
    width,
    height,
    durationSec: isVideo ? 15 : undefined,
    source: "upload",
    notes: `Uploaded via ${stored.mode === "s3" ? "AWS S3" : "local public/uploads"}`,
  };
}

type AssetRef = {
  id: string;
  userId: string;
  filename: string;
  mimeType: string;
  mediaType: string;
  url: string;
  storageKey?: string | null;
  width?: number | null;
  height?: number | null;
  durationSec?: number | null;
};

async function loadBytes(asset: AssetRef) {
  return readObjectBuffer(asset.storageKey, asset.url);
}

export async function processResize(input: {
  asset: AssetRef;
  placementId: string;
}) {
  const placement = getPlacementSizes().find((p) => p.id === input.placementId);
  if (!placement) throw new Error("Unknown placement");
  const buffer = await loadBytes(input.asset);
  if (input.asset.mediaType === "video") {
    if (!(await isFfmpegAvailable())) {
      throw new Error("FFmpeg is not installed on this host. Install FFmpeg to process video.");
    }
    const out = await resizeVideo({
      buffer,
      userId: input.asset.userId,
      filename: input.asset.filename,
      width: placement.width,
      height: placement.height,
    });
    return {
      ...out,
      mimeType: "video/mp4",
      mediaType: "video" as const,
      filename: `${placement.id}-${input.asset.filename}`,
      brandApplied: false,
      source: "resize",
      placement: placement.id,
      notes: `Resized video to ${placement.name} (${placement.width}x${placement.height})`,
    };
  }
  const out = await resizeImage({
    buffer,
    userId: input.asset.userId,
    filename: input.asset.filename,
    width: placement.width,
    height: placement.height,
  });
  return {
    url: out.url,
    storageKey: out.storageKey,
    width: out.width,
    height: out.height,
    mimeType: "image/jpeg",
    mediaType: "image" as const,
    filename: `${placement.id}-${input.asset.filename}`,
    brandApplied: false,
    source: "resize",
    placement: placement.id,
    notes: `Resized image to ${placement.name} (${placement.width}x${placement.height})`,
  };
}

export async function processBrand(input: { asset: AssetRef; brand: BrandKit }) {
  const buffer = await loadBytes(input.asset);
  if (input.asset.mediaType === "video") {
    if (!(await isFfmpegAvailable())) {
      throw new Error("FFmpeg is not installed on this host. Install FFmpeg to brand video.");
    }
    const out = await brandVideo({
      buffer,
      userId: input.asset.userId,
      filename: input.asset.filename,
      brand: input.brand,
    });
    return {
      ...out,
      mimeType: "video/mp4",
      mediaType: "video" as const,
      filename: `branded-${input.asset.filename}`,
      brandApplied: true,
      source: "brand",
      notes: "Applied brand accent bar via FFmpeg",
    };
  }
  const out = await brandImage({
    buffer,
    userId: input.asset.userId,
    filename: input.asset.filename,
    brand: input.brand,
  });
  return {
    url: out.url,
    storageKey: out.storageKey,
    width: out.width,
    height: out.height,
    mimeType: "image/jpeg",
    mediaType: "image" as const,
    filename: `branded-${input.asset.filename}`,
    brandApplied: true,
    source: "brand",
    notes: "Applied brand colors/logo via Sharp",
  };
}

export async function processEnhance(input: { asset: AssetRef }) {
  if (input.asset.mediaType === "video") {
    throw new Error("Enhance currently supports images only (Sharp). Use snippet/trim for video.");
  }
  const buffer = await loadBytes(input.asset);
  const out = await enhanceImage({
    buffer,
    userId: input.asset.userId,
    filename: input.asset.filename,
  });
  return {
    url: out.url,
    storageKey: out.storageKey,
    width: out.width,
    height: out.height,
    mimeType: "image/jpeg",
    mediaType: "image" as const,
    filename: `enhanced-${input.asset.filename}`,
    brandApplied: false,
    source: "enhance",
    notes: "Normalized + sharpened + re-encoded (Sharp)",
  };
}

export async function processSnippet(input: { asset: AssetRef; durationSec?: number }) {
  if (input.asset.mediaType !== "video") {
    throw new Error("Snippets require a video asset.");
  }
  if (!(await isFfmpegAvailable())) {
    throw new Error("FFmpeg is not installed on this host. Install FFmpeg to create snippets.");
  }
  const buffer = await loadBytes(input.asset);
  const out = await createSnippet({
    buffer,
    userId: input.asset.userId,
    filename: input.asset.filename,
    durationSec: input.durationSec,
  });
  return {
    ...out,
    mimeType: "video/mp4",
    mediaType: "video" as const,
    filename: `snippet-${input.asset.filename}`,
    brandApplied: false,
    source: "snippet",
    notes: `Short-form promo clip (${out.durationSec}s)`,
  };
}

export async function processCaptions(input: {
  asset: AssetRef;
  industry?: string | null;
  businessName?: string | null;
}) {
  const buffer = await loadBytes(input.asset);
  const result = await generateCaptions({
    buffer,
    filename: input.asset.filename,
    userId: input.asset.userId,
    mediaType: input.asset.mediaType === "video" ? "video" : "image",
    industry: input.industry,
    businessName: input.businessName,
  });
  return {
    captions: result.text,
    captionTrackUrl: result.captionTrackUrl,
    provider: result.provider,
    notes: `Captions via ${result.provider}`,
  };
}

export async function processSaveCaptions(input: {
  asset: AssetRef;
  text: string;
}) {
  return saveCaptionTrack({
    userId: input.asset.userId,
    filename: input.asset.filename,
    text: input.text,
  });
}

export async function processManualEdit(input: {
  asset: AssetRef;
  crop?: { x: number; y: number; w: number; h: number };
  trim?: { startSec: number; endSec: number };
}) {
  const buffer = await loadBytes(input.asset);
  if (input.asset.mediaType === "image") {
    if (!input.crop) throw new Error("Crop region required for image edit.");
    const out = await cropImage({
      buffer,
      userId: input.asset.userId,
      filename: input.asset.filename,
      crop: input.crop,
    });
    return {
      url: out.url,
      storageKey: out.storageKey,
      width: out.width,
      height: out.height,
      mimeType: "image/jpeg",
      mediaType: "image" as const,
      filename: `edit-${input.asset.filename}`,
      brandApplied: false,
      source: "manual_edit",
      notes: "Manual crop edit",
    };
  }
  if (!input.trim) throw new Error("Trim range required for video edit.");
  if (!(await isFfmpegAvailable())) {
    throw new Error("FFmpeg is not installed on this host. Install FFmpeg to trim video.");
  }
  const out = await trimVideo({
    buffer,
    userId: input.asset.userId,
    filename: input.asset.filename,
    startSec: input.trim.startSec,
    endSec: input.trim.endSec,
  });
  return {
    ...out,
    mimeType: "video/mp4",
    mediaType: "video" as const,
    filename: `edit-${input.asset.filename}`,
    brandApplied: false,
    source: "manual_edit",
    notes: `Manual trim ${input.trim.startSec}s–${input.trim.endSec}s`,
  };
}
