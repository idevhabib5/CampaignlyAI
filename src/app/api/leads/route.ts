import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { initialOutreach } from "@/lib/services/whatsapp";

export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const status = searchParams.get("status");
    const category = searchParams.get("category");

    const leads = await prisma.lead.findMany({
      where: {
        userId: session.id,
        ...(status ? { status } : {}),
        ...(category ? { category } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { email: { contains: q } },
                { phone: { contains: q } },
              ],
            }
          : {}),
      },
      include: {
        campaign: { select: { id: true, name: true } },
        conversation: { select: { id: true, leadScore: true, readyForConversion: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return jsonOk({ leads });
  } catch (error) {
    return handleApiError(error);
  }
}

const syncSchema = z.object({ action: z.literal("sync") });

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json();

    if (body.action === "sync") {
      syncSchema.parse(body);
      const campaign = await prisma.campaign.findFirst({
        where: { userId: session.id, status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
      });

      const names = ["Riley Quinn", "Avery Chen", "Jamie Soto", "Cameron Diaz"];
      const pick = names[Math.floor(Math.random() * names.length)];
      const lead = await prisma.lead.create({
        data: {
          userId: session.id,
          campaignId: campaign?.id,
          name: pick,
          email: `${pick.toLowerCase().replace(" ", ".")}@email.com`,
          phone: `+1-512-555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
          status: "NEW",
          score: 5,
          category: "new",
          source: "meta_lead_form",
        },
      });

      const business = await prisma.businessProfile.findUnique({ where: { userId: session.id } });
      await prisma.whatsAppConversation.create({
        data: {
          userId: session.id,
          leadId: lead.id,
          status: "AI_ACTIVE",
          messages: {
            create: {
              direction: "outbound",
              sender: "AI",
              content: initialOutreach(
                lead.name,
                business?.businessName || "our business",
                business?.industry || "Local Services"
              ),
            },
          },
        },
      });

      await prisma.notification.create({
        data: {
          userId: session.id,
          type: "lead",
          title: "New Meta lead synced",
          message: `${lead.name} was imported from Meta lead forms (mock sync).`,
        },
      });

      return jsonOk({ lead, message: "Lead data refreshed from Meta (mock)." });
    }

    const updateSchema = z.object({
      id: z.string(),
      status: z.string().optional(),
      category: z.string().optional(),
      notes: z.string().optional(),
    });
    const data = updateSchema.parse(body);
    const existing = await prisma.lead.findFirst({ where: { id: data.id, userId: session.id } });
    if (!existing) return jsonError("Lead not found", 404);

    const lead = await prisma.lead.update({
      where: { id: data.id },
      data: {
        status: data.status ?? existing.status,
        category: data.category ?? existing.category,
        notes: data.notes ?? existing.notes,
        lastActivityAt: new Date(),
      },
    });
    return jsonOk({ lead });
  } catch (error) {
    return handleApiError(error);
  }
}
