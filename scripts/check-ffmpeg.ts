import { isFfmpegAvailable, ensureFfmpegPaths } from "../src/lib/services/media/video";

async function main() {
  const p = await ensureFfmpegPaths();
  console.log("paths", p);
  console.log("available", await isFfmpegAvailable());
}

main();
