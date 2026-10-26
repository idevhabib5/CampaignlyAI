export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import {
  assertSelectableAssets,
  connectMetaAccount,
  disconnectMetaAccount,
  listMockMetaAssets,
  type MetaConnectionSnapshot,
} from "@/lib/services/meta";

function parseJsonList<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function loadConnection(userId: string): Promise<MetaConnectionSnapshot> {
  const row = await prisma.metaConnection.findUnique({ where: { userId } });
  const defaults = listMockMetaAssets();
  if (!row || row.status === "DISCONNECTED") {
    return {
      connected: false,
      status: "DISCONNECTED",
      adAccounts: defaults.adAccounts,
      pages: defaults.pages,
      accessTokenPreview: null,
      adAccountId: null,
      pageId: null,
    };
  }
  return {
    connected: row.status === "CONNECTED",
    status: row.status as MetaConnectionSnapshot["status"],
    adAccounts: parseJsonList(row.adAccountsJson, defaults.adAccounts),
    pages: parseJsonList(row.pagesJson, defaults.pages),
    accessTokenPreview: row.tokenPreview,
    adAccountId: row.adAccountId,
    pageId: row.pageId,
  };
}

export async function GET() {
  try {
    const session = await requireSession();
    const connection = await loadConnection(session.id);
    const business = await prisma.businessProfile.findUnique({ where: { userId: session.id } });
    return jsonOk({
      connection,
      businessConnected: Boolean(business),
      businessLocation: business?.location || null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

const postSchema = z.object({
  action: z.enum(["connect", "disconnect", "select_assets", "reconnect"]).default("connect"),
  adAccountId: z.string().optional(),
  pageId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json().catch(() => ({}));
    const data = postSchema.parse(body);

    if (data.action === "disconnect") {
      await disconnectMetaAccount(session.id);
      await prisma.metaConnection.upsert({
        where: { userId: session.id },
        create: {
          userId: session.id,
          status: "DISCONNECTED",
          disconnectedAt: new Date(),
          adAccountId: null,
          pageId: null,
          tokenPreview: null,
        },
        update: {
          status: "DISCONNECTED",
          disconnectedAt: new Date(),
          adAccountId: null,
          pageId: null,
          tokenPreview: null,
        },
      });
      await prisma.notification.create({
        data: {
          userId: session.id,
          type: "meta",
          title: "Meta disconnected",
          message:
            "Connection cleared. Existing Meta ads may continue running until stopped in Ads Manager (FR-036).",
        },
      });
      return jsonOk({
        connection: await loadConnection(session.id),
        message:
          "Meta disconnected. Existing ads may continue running in Meta until you stop them there.",
      });
    }

    if (data.action === "select_assets") {
      const existing = await prisma.metaConnection.findUnique({ where: { userId: session.id } });
      if (!existing || existing.status !== "CONNECTED") {
        return jsonError("Connect Meta before selecting assets (FR-026).", 400);
      }
      const lists = {
        adAccounts: parseJsonList(existing.adAccountsJson, listMockMetaAssets().adAccounts),
        pages: parseJsonList(existing.pagesJson, listMockMetaAssets().pages),
      };
      const adAccountId = data.adAccountId || existing.adAccountId;
      const pageId = data.pageId || existing.pageId;
      if (!adAccountId || !pageId) {
        return jsonError("Ad account and Page are required.", 400);
      }
      const check = assertSelectableAssets(adAccountId, pageId, lists);
      if (!check.ok) return jsonError(check.reason, 400);

      await prisma.metaConnection.update({
        where: { userId: session.id },
        data: { adAccountId, pageId },
      });
      return jsonOk({ connection: await loadConnection(session.id) });
    }

    // connect | reconnect
    const snapshot = await connectMetaAccount(session.id);
    await prisma.metaConnection.upsert({
      where: { userId: session.id },
      create: {
        userId: session.id,
        status: "CONNECTED",
        adAccountId: snapshot.adAccountId,
        pageId: snapshot.pageId,
        tokenPreview: snapshot.accessTokenPreview,
        adAccountsJson: JSON.stringify(snapshot.adAccounts),
        pagesJson: JSON.stringify(snapshot.pages),
        connectedAt: new Date(),
        disconnectedAt: null,
      },
      update: {
        status: "CONNECTED",
        adAccountId: snapshot.adAccountId,
        pageId: snapshot.pageId,
        tokenPreview: snapshot.accessTokenPreview,
        adAccountsJson: JSON.stringify(snapshot.adAccounts),
        pagesJson: JSON.stringify(snapshot.pages),
        connectedAt: new Date(),
        disconnectedAt: null,
      },
    });

    await prisma.notification.create({
      data: {
        userId: session.id,
        type: "meta",
        title: data.action === "reconnect" ? "Meta reconnected" : "Meta account connected",
        message: "OAuth mock succeeded. Ad accounts and pages are ready for campaign deployment.",
      },
    });

    return jsonOk({ connection: await loadConnection(session.id) });
  } catch (error) {
    return handleApiError(error);
  }
}
