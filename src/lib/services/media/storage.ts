import { mkdir, writeFile, unlink, readFile } from "node:fs/promises";
import path from "node:path";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const LOCAL_DIR = process.env.MEDIA_LOCAL_DIR || "public/uploads";

export function isS3Configured() {
  if (process.env.USE_MOCK_S3 === "true") return false;
  return Boolean(
    process.env.S3_BUCKET &&
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY
  );
}

export function getStorageMode(): "s3" | "local" {
  return isS3Configured() ? "s3" : "local";
}

function getS3() {
  return new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

function extensionForContentType(contentType: string, fallbackName: string) {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "text/vtt": ".vtt",
  };
  if (map[contentType]) return map[contentType];
  const ext = path.extname(fallbackName);
  return ext || ".bin";
}

function withCorrectExtension(filename: string, contentType: string) {
  const base = filename.replace(/\.[^.]+$/, "") || filename;
  return `${base}${extensionForContentType(contentType, filename)}`;
}

export async function putObject(input: {
  key: string;
  body: Buffer;
  contentType: string;
}): Promise<{ url: string; storageKey: string; mode: "s3" | "local" }> {
  const mode = getStorageMode();
  if (mode === "s3") {
    const bucket = process.env.S3_BUCKET!;
    await getS3().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
      })
    );
    const base = process.env.S3_PUBLIC_BASE_URL || `https://${bucket}.s3.amazonaws.com`;
    return {
      url: `${base.replace(/\/$/, "")}/${input.key}`,
      storageKey: input.key,
      mode: "s3",
    };
  }

  const absDir = path.join(process.cwd(), LOCAL_DIR);
  await mkdir(absDir, { recursive: true });
  // Flatten key and force extension to match bytes (Sharp writes JPEG even when source was PNG)
  const flat = input.key.replace(/^uploads\//, "").replace(/\//g, "_");
  const filename = withCorrectExtension(flat, input.contentType);
  const absPath = path.join(absDir, filename);
  await writeFile(absPath, input.body);
  // Relative URL so previews work on any host/port (not locked to NEXT_PUBLIC_APP_URL)
  const publicPath = `/uploads/${filename}`;
  return {
    url: publicPath,
    storageKey: `local:${filename}`,
    mode: "local",
  };
}

export async function deleteObject(storageKey: string | null | undefined) {
  if (!storageKey) return;
  if (storageKey.startsWith("local:")) {
    const filename = storageKey.slice("local:".length);
    const absPath = path.join(process.cwd(), LOCAL_DIR, filename);
    try {
      await unlink(absPath);
    } catch {
      /* already gone */
    }
    return;
  }
  if (!isS3Configured()) return;
  await getS3().send(
    new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: storageKey,
    })
  );
}

/** Resolve a stored asset to a local temp path or downloadable buffer. */
export async function readObjectBuffer(storageKey: string | null | undefined, url: string): Promise<Buffer> {
  if (storageKey?.startsWith("local:")) {
    const filename = storageKey.slice("local:".length);
    return readFile(path.join(process.cwd(), LOCAL_DIR, filename));
  }
  if (url.startsWith("http://") || url.startsWith("https://")) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch media: ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
  // Relative /uploads path
  if (url.includes("/uploads/")) {
    const filename = url.split("/uploads/").pop()!;
    return readFile(path.join(process.cwd(), LOCAL_DIR, filename.split("?")[0]));
  }
  throw new Error("Unable to resolve media bytes for processing");
}

export function makeStorageKey(userId: string, filename: string) {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  return `uploads/${userId}/${Date.now()}-${safe}`;
}

/** Fix broken previews: absolute localhost URLs + JPEG bytes saved as .png */
export async function repairLocalAssetUrl(asset: {
  url: string;
  storageKey?: string | null;
  mimeType: string;
}): Promise<{ url: string; storageKey?: string | null; mimeType: string; changed: boolean }> {
  let url = asset.url;
  let storageKey = asset.storageKey;
  let mimeType = asset.mimeType;
  let changed = false;

  // Prefer relative /uploads paths so host/port never breaks <img src>
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(url)) {
    try {
      url = new URL(url).pathname;
      changed = true;
    } catch {
      /* keep */
    }
  }

  if (storageKey?.startsWith("local:")) {
    const { rename } = await import("node:fs/promises");
    const oldName = storageKey.slice("local:".length);
    const absOld = path.join(process.cwd(), LOCAL_DIR, oldName);
    try {
      const buf = await readFile(absOld);
      const isJpeg = buf[0] === 0xff && buf[1] === 0xd8;
      const isPng = buf[0] === 0x89 && buf[1] === 0x50;
      if (isJpeg && /\.png$/i.test(oldName)) {
        const newName = oldName.replace(/\.png$/i, ".jpg");
        const absNew = path.join(process.cwd(), LOCAL_DIR, newName);
        await rename(absOld, absNew);
        storageKey = `local:${newName}`;
        url = `/uploads/${newName}`;
        mimeType = "image/jpeg";
        changed = true;
      } else if (isPng && mimeType !== "image/png") {
        mimeType = "image/png";
        changed = true;
      }
    } catch {
      /* file missing — leave as-is */
    }
  }

  return { url, storageKey, mimeType, changed };
}
