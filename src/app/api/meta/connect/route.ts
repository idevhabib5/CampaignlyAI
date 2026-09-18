export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonOk } from "@/lib/api";
import { connectMetaAccount } from "@/lib/services/meta";

export async function GET() {
  try {
    const session = await requireSession();
    // Meta OAuth mocked — always returns demo connection options
    const connection = await connectMetaAccount(session.id);
    const business = await prisma.businessProfile.findUnique({ where: { userId: session.id } });
    return jsonOk({ connection, businessConnected: Boolean(business) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST() {
  try {
    const session = await requireSession();
    const connection = await connectMetaAccount(session.id);
    await prisma.notification.create({
      data: {
        userId: session.id,
        type: "meta",
        title: "Meta account connected",
        message: "OAuth mock succeeded. Ad accounts and pages are ready for campaign deployment.",
      },
    });
    return jsonOk({ connection });
  } catch (error) {
    return handleApiError(error);
  }
}
