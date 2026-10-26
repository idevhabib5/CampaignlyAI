import { prisma } from "../src/lib/db";

async function main() {
  const assets = await prisma.mediaAsset.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { filename: true, url: true, storageKey: true, mimeType: true },
  });
  console.log(JSON.stringify(assets, null, 2));
  await prisma.$disconnect();
}

main();
