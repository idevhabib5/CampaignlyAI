/**
 * Smoke test Module 4 — Meta connection, deploy, sync, pause, disconnect.
 * Usage: npx tsx scripts/smoke-meta.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function login() {
  const res = await fetch(`${BASE}/api/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "login",
      email: "owner@fitstudio.demo",
      password: "demo1234",
    }),
  });
  const setCookie = res.headers.getSetCookie?.() || [];
  const cookieHeader =
    setCookie.map((c) => c.split(";")[0]).join("; ") ||
    (res.headers.get("set-cookie") || "").split(",").map((p) => p.split(";")[0].trim()).filter(Boolean).join("; ");
  if (!res.ok) throw new Error(`Login failed: ${await res.text()}`);
  return cookieHeader;
}

async function api(cookie: string, path: string, init?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
      ...(init?.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

async function main() {
  console.log("M04 smoke against", BASE);
  const cookie = await login();
  console.log("✓ logged in");

  // Ensure connected
  let { res, data } = await api(cookie, "/api/meta/connect", {
    method: "POST",
    body: JSON.stringify({ action: "connect" }),
  });
  if (!res.ok) throw new Error(`connect: ${JSON.stringify(data)}`);
  console.log("✓ Meta connected", data.connection?.status);

  ({ res, data } = await api(cookie, "/api/meta/connect", {
    method: "POST",
    body: JSON.stringify({
      action: "select_assets",
      adAccountId: "act_100200300",
      pageId: "page_778899",
    }),
  }));
  if (!res.ok) throw new Error(`select_assets: ${JSON.stringify(data)}`);
  console.log("✓ assets selected");

  const owner = await prisma.user.findUnique({
    where: { email: "owner@fitstudio.demo" },
    include: { creatives: true, mediaAssets: true },
  });
  if (!owner?.creatives[0] || !owner.mediaAssets[0]) throw new Error("Seed creative/media missing");

  ({ res, data } = await api(cookie, "/api/campaigns", {
    method: "POST",
    body: JSON.stringify({
      name: `Smoke Deploy ${Date.now().toString(36)}`,
      adCreativeId: owner.creatives[0].id,
      mediaAssetId: owner.mediaAssets[0].id,
      objective: "LEADS",
      budgetType: "DAILY",
      dailyBudget: 22,
      scheduleStart: new Date().toISOString().slice(0, 10),
      specialAdCategory: "NONE",
      resolvedLocation: "Austin, TX, USA",
      locationConfirmed: true,
      placements: ["feed_square", "story_reels"],
      adAccountId: "act_100200300",
      pageId: "page_778899",
      deploy: true,
      targeting: { countries: ["US"], cities: ["Austin"], radiusKm: 25, ageMin: 25, ageMax: 40 },
    }),
  }));
  if (!res.ok) throw new Error(`deploy: ${JSON.stringify(data)}`);
  const campaignId = data.campaign.id;
  console.log("✓ deployed", campaignId, data.campaign.status, data.bradley?.passed);

  ({ res, data } = await api(cookie, "/api/campaigns", {
    method: "PATCH",
    body: JSON.stringify({ id: campaignId, action: "sync" }),
  }));
  if (!res.ok) throw new Error(`sync: ${JSON.stringify(data)}`);
  console.log(
    "✓ sync",
    data.campaign.metricsAvailable ? `impr=${data.campaign.impressions}` : "unavailable",
    data.campaign.metaStatus
  );

  // Failed sync must preserve metrics
  const before = data.campaign.impressions;
  ({ res, data } = await api(cookie, "/api/campaigns", {
    method: "PATCH",
    body: JSON.stringify({ id: campaignId, action: "sync", forceSyncFail: true }),
  }));
  if (!res.ok) throw new Error(`sync fail path: ${JSON.stringify(data)}`);
  if (data.campaign.impressions !== before) throw new Error("Failed sync wiped metrics");
  console.log("✓ failed sync preserved snapshot");

  ({ res, data } = await api(cookie, "/api/campaigns", {
    method: "PATCH",
    body: JSON.stringify({ id: campaignId, action: "pause" }),
  }));
  if (!res.ok) throw new Error(`pause: ${JSON.stringify(data)}`);
  console.log("✓ paused", data.campaign.status);

  // Cross-tenant media reject
  const other = await prisma.user.findUnique({ where: { email: "newbie@demo.com" } });
  if (other) {
    const foreign = await prisma.mediaAsset.create({
      data: {
        userId: other.id,
        filename: "foreign.png",
        mimeType: "image/png",
        mediaType: "image",
        url: "https://placehold.co/100",
        source: "upload",
      },
    });
    ({ res, data } = await api(cookie, "/api/campaigns", {
      method: "POST",
      body: JSON.stringify({
        name: "Should fail",
        adCreativeId: owner.creatives[0].id,
        mediaAssetId: foreign.id,
        objective: "LEADS",
        locationConfirmed: true,
        resolvedLocation: "Austin, TX, USA",
        deploy: true,
      }),
    }));
    if (res.ok) throw new Error("Cross-tenant media was accepted");
    console.log("✓ cross-tenant media rejected");
    await prisma.mediaAsset.delete({ where: { id: foreign.id } });
  }

  ({ res, data } = await api(cookie, "/api/meta/connect", {
    method: "POST",
    body: JSON.stringify({ action: "disconnect" }),
  }));
  if (!res.ok) throw new Error(`disconnect: ${JSON.stringify(data)}`);
  console.log("✓ disconnected", data.connection?.status);

  ({ res, data } = await api(cookie, "/api/campaigns", {
    method: "PATCH",
    body: JSON.stringify({ id: campaignId, action: "activate" }),
  }));
  if (res.ok) throw new Error("Activate should fail after disconnect");
  console.log("✓ Meta writes blocked after disconnect");

  // Restore connection for demo account
  await api(cookie, "/api/meta/connect", {
    method: "POST",
    body: JSON.stringify({ action: "connect" }),
  });
  console.log("M04 smoke OK");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
