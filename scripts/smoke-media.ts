import sharp from "sharp";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import {
  uploadMediaFile,
  processResize,
  processEnhance,
  processBrand,
  processCaptions,
  processManualEdit,
  getMediaPipelineMeta,
} from "../src/lib/services/media";

async function main() {
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const buf = await sharp({
    create: { width: 800, height: 800, channels: 3, background: { r: 15, g: 118, b: 110 } },
  })
    .jpeg()
    .toBuffer();
  await writeFile(path.join(dir, "_smoke-source.jpg"), buf);

  const meta = await getMediaPipelineMeta();
  console.log("pipeline", meta);

  const uploaded = await uploadMediaFile({
    userId: "smoke-user",
    filename: "smoke-hero.jpg",
    mimeType: "image/jpeg",
    buffer: buf,
  });
  console.log("upload", uploaded.storageKey, uploaded.width, uploaded.height);

  const ref = {
    id: "1",
    userId: "smoke-user",
    filename: uploaded.filename,
    mimeType: uploaded.mimeType,
    mediaType: "image" as const,
    url: uploaded.url,
    storageKey: uploaded.storageKey,
  };

  const resized = await processResize({ asset: ref, placementId: "feed_square" });
  console.log("resize", resized.width, resized.height, resized.source);

  const enhanced = await processEnhance({ asset: ref });
  console.log("enhance", enhanced.source);

  const branded = await processBrand({
    asset: ref,
    brand: { brandColors: "#0f766e,#ea580c", logoUrl: null },
  });
  console.log("brand", branded.brandApplied, branded.source);

  const cropped = await processManualEdit({
    asset: ref,
    crop: { x: 0.1, y: 0.1, w: 0.7, h: 0.7 },
  });
  console.log("crop", cropped.width, cropped.height, cropped.source);

  const caps = await processCaptions({
    asset: ref,
    industry: "Fitness",
    businessName: "FitStudio",
  });
  console.log("captions", caps.provider, (caps.captions || "").slice(0, 100));
  console.log("SMOKE_OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
