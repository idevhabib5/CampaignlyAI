import { mkdir, writeFile, unlink, readFile, access } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { tmpdir, homedir } from "node:os";
import { randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import ffmpeg from "fluent-ffmpeg";
import { putObject, makeStorageKey } from "./storage";
import type { BrandKit } from "./image";

let resolved = false;

function candidateBins() {
  const home = homedir();
  const local = process.env.LOCALAPPDATA || path.join(home, "AppData", "Local");
  return [
    process.env.FFMPEG_PATH,
    process.env.FFPROBE_PATH,
    "ffmpeg",
    "ffprobe",
    path.join(local, "Microsoft", "WinGet", "Links", "ffmpeg.exe"),
    path.join(local, "Microsoft", "WinGet", "Links", "ffprobe.exe"),
    "C:\\ffmpeg\\bin\\ffmpeg.exe",
    "C:\\ffmpeg\\bin\\ffprobe.exe",
  ].filter(Boolean) as string[];
}

function whichOnPath(bin: string): string | null {
  try {
    const cmd = process.platform === "win32" ? "where" : "which";
    const out = execFileSync(cmd, [bin], { encoding: "utf8" }).trim().split(/\r?\n/)[0];
    return out || null;
  } catch {
    return null;
  }
}

async function fileExists(p: string) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

/** Point fluent-ffmpeg at WinGet / PATH binaries even if the Node process started before install. */
export async function ensureFfmpegPaths(): Promise<{ ffmpegPath?: string; ffprobePath?: string }> {
  if (resolved) {
    return {};
  }
  let ffmpegPath =
    process.env.FFMPEG_PATH ||
    whichOnPath("ffmpeg") ||
    whichOnPath("ffmpeg.exe") ||
    null;
  let ffprobePath =
    process.env.FFPROBE_PATH ||
    whichOnPath("ffprobe") ||
    whichOnPath("ffprobe.exe") ||
    null;

  for (const c of candidateBins()) {
    if (!ffmpegPath && /ffmpeg(\.exe)?$/i.test(c) && (c === "ffmpeg" ? whichOnPath("ffmpeg") : existsSync(c))) {
      ffmpegPath = c === "ffmpeg" ? whichOnPath("ffmpeg") : c;
    }
    if (!ffprobePath && /ffprobe(\.exe)?$/i.test(c) && (c === "ffprobe" ? whichOnPath("ffprobe") : existsSync(c))) {
      ffprobePath = c === "ffprobe" ? whichOnPath("ffprobe") : c;
    }
  }

  // WinGet Links folder (common after winget install Gyan.FFmpeg)
  const wingetFfmpeg = path.join(
    process.env.LOCALAPPDATA || path.join(homedir(), "AppData", "Local"),
    "Microsoft",
    "WinGet",
    "Links",
    "ffmpeg.exe"
  );
  const wingetFfprobe = path.join(
    process.env.LOCALAPPDATA || path.join(homedir(), "AppData", "Local"),
    "Microsoft",
    "WinGet",
    "Links",
    "ffprobe.exe"
  );
  if (!ffmpegPath && (await fileExists(wingetFfmpeg))) ffmpegPath = wingetFfmpeg;
  if (!ffprobePath && (await fileExists(wingetFfprobe))) ffprobePath = wingetFfprobe;

  if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);
  if (ffprobePath) ffmpeg.setFfprobePath(ffprobePath);
  resolved = Boolean(ffmpegPath);
  return { ffmpegPath: ffmpegPath || undefined, ffprobePath: ffprobePath || undefined };
}

export async function isFfmpegAvailable(): Promise<boolean> {
  await ensureFfmpegPaths();
  return new Promise((resolve) => {
    ffmpeg.getAvailableFormats((err) => {
      resolve(!err);
    });
  });
}

async function withTempFiles(
  inputBuffer: Buffer,
  ext: string,
  run: (inputPath: string, outputPath: string) => Promise<void>
): Promise<Buffer> {
  await ensureFfmpegPaths();
  const id = randomBytes(8).toString("hex");
  const dir = path.join(tmpdir(), "campaignly-media");
  await mkdir(dir, { recursive: true });
  const inputPath = path.join(dir, `${id}-in.${ext}`);
  const outputPath = path.join(dir, `${id}-out.mp4`);
  await writeFile(inputPath, inputBuffer);
  try {
    await run(inputPath, outputPath);
    return await readFile(outputPath);
  } finally {
    await unlink(inputPath).catch(() => undefined);
    await unlink(outputPath).catch(() => undefined);
  }
}

function runFfmpeg(build: (cmd: ffmpeg.FfmpegCommand) => ffmpeg.FfmpegCommand): Promise<void> {
  return new Promise((resolve, reject) => {
    const cmd = build(ffmpeg());
    cmd
      .on("end", () => resolve())
      .on("error", (err: Error) => reject(err))
      .run();
  });
}

function probeDuration(filePath: string): Promise<number> {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) return resolve(15);
      resolve(Math.round(Number(data.format.duration) || 15));
    });
  });
}

export async function trimVideo(input: {
  buffer: Buffer;
  userId: string;
  filename: string;
  startSec: number;
  endSec: number;
}): Promise<{ url: string; storageKey: string; durationSec: number; width: number; height: number }> {
  const start = Math.max(0, input.startSec);
  const duration = Math.max(0.5, input.endSec - start);
  const out = await withTempFiles(input.buffer, "mp4", async (inPath, outPath) => {
    await runFfmpeg((cmd) =>
      cmd
        .input(inPath)
        .setStartTime(start)
        .setDuration(duration)
        .outputOptions(["-c:v libx264", "-c:a aac", "-movflags +faststart"])
        .output(outPath)
    );
  });
  const key = makeStorageKey(input.userId, `trim-${input.filename}.mp4`);
  const stored = await putObject({ key, body: out, contentType: "video/mp4" });
  return {
    url: stored.url,
    storageKey: stored.storageKey,
    durationSec: Math.round(duration),
    width: 1080,
    height: 1920,
  };
}

export async function resizeVideo(input: {
  buffer: Buffer;
  userId: string;
  filename: string;
  width: number;
  height: number;
}): Promise<{ url: string; storageKey: string; durationSec: number; width: number; height: number }> {
  const out = await withTempFiles(input.buffer, "mp4", async (inPath, outPath) => {
    const dur = await probeDuration(inPath);
    await runFfmpeg((cmd) =>
      cmd
        .input(inPath)
        .videoFilters([
          `scale=${input.width}:${input.height}:force_original_aspect_ratio=increase`,
          `crop=${input.width}:${input.height}`,
        ])
        .outputOptions(["-c:v libx264", "-c:a aac", "-movflags +faststart"])
        .output(outPath)
    );
    void dur;
  });
  // re-probe via temp write for duration
  const dir = path.join(tmpdir(), "campaignly-media");
  const probePath = path.join(dir, `${randomBytes(4).toString("hex")}-probe.mp4`);
  await writeFile(probePath, out);
  const durationSec = await probeDuration(probePath);
  await unlink(probePath).catch(() => undefined);

  const key = makeStorageKey(input.userId, `vresize-${input.width}x${input.height}-${input.filename}.mp4`);
  const stored = await putObject({ key, body: out, contentType: "video/mp4" });
  return {
    url: stored.url,
    storageKey: stored.storageKey,
    durationSec,
    width: input.width,
    height: input.height,
  };
}

export async function brandVideo(input: {
  buffer: Buffer;
  userId: string;
  filename: string;
  brand: BrandKit;
}): Promise<{ url: string; storageKey: string; durationSec: number; width: number; height: number }> {
  const accent = (input.brand.brandColors?.match(/#([0-9a-fA-F]{3,8})/) || ["#0f766e"])[0];
  const out = await withTempFiles(input.buffer, "mp4", async (inPath, outPath) => {
    const filters = [
      `drawbox=x=0:y=ih-60:w=iw:h=60:color=${accent.replace("#", "0x")}:t=fill`,
    ];
    await runFfmpeg((cmd) =>
      cmd
        .input(inPath)
        .videoFilters(filters)
        .outputOptions(["-c:v libx264", "-c:a aac", "-movflags +faststart"])
        .output(outPath)
    );
  });
  const key = makeStorageKey(input.userId, `vbrand-${input.filename}.mp4`);
  const stored = await putObject({ key, body: out, contentType: "video/mp4" });
  return {
    url: stored.url,
    storageKey: stored.storageKey,
    durationSec: 15,
    width: 1080,
    height: 1920,
  };
}

export async function createSnippet(input: {
  buffer: Buffer;
  userId: string;
  filename: string;
  durationSec?: number;
}): Promise<{ url: string; storageKey: string; durationSec: number; width: number; height: number }> {
  const clip = Math.min(30, Math.max(3, input.durationSec ?? 8));
  return trimVideo({
    buffer: input.buffer,
    userId: input.userId,
    filename: `snippet-${input.filename}`,
    startSec: 0,
    endSec: clip,
  });
}
