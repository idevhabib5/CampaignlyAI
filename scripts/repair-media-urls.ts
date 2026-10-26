import { prisma } from "../src/lib/db";
import { repairLocalAssetUrl } from "../src/lib/services/media";

async function main() {
  const assets = await prisma.mediaAsset.findMany();
  let n = 0;
  for (const asset of assets) {
    const fix = await repairLocalAssetUrl(asset);
    if (fix.changed) {
      await prisma.mediaAsset.update({
        where: { id: asset.id },
        data: { url: fix.url, storageKey: fix.storageKey, mimeType: fix.mimeType },
      });
      console.log("fixed", asset.filename, "->", fix.url);
      n += 1;
    }
  }
  console.log(`Repaired ${n} assets`);
  await prisma.$disconnect();
}

main();
