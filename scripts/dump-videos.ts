import { prisma } from "../src/lib/db";

async function main() {
  const v = await prisma.mediaAsset.findMany({
    where: { mediaType: "video" },
    select: {
      id: true,
      filename: true,
      url: true,
      mimeType: true,
      captions: true,
      captionTrackUrl: true,
      storageKey: true,
      durationSec: true,
    },
  });
  console.log(JSON.stringify(v, null, 2));
  await prisma.$disconnect();
}

main();
