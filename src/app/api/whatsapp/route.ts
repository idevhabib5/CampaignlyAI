import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { scoreInboundMessage } from "@/lib/services/whatsapp";

export async function GET() {
  try {
    const session = await requireSession();
    const conversations = await prisma.whatsAppConversation.findMany({
      where: { userId: session.id },
      include: {
        lead: true,
        messages: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { lastMessageAt: "desc" },
    });
    return jsonOk({ conversations });
  } catch (error) {
    return handleApiError(error);
  }
}

const messageSchema = z.object({
  conversationId: z.string(),
  action: z.enum(["simulate_reply", "takeover", "release_to_ai", "send_owner"]),
  content: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const data = messageSchema.parse(await req.json());

    const conversation = await prisma.whatsAppConversation.findFirst({
      where: { id: data.conversationId, userId: session.id },
      include: { lead: true },
    });
    if (!conversation) return jsonError("Conversation not found", 404);

    if (data.action === "takeover") {
      const updated = await prisma.whatsAppConversation.update({
        where: { id: conversation.id },
        data: { status: "MANUAL" },
        include: { lead: true, messages: { orderBy: { createdAt: "asc" } } },
      });
      return jsonOk({ conversation: updated });
    }

    if (data.action === "release_to_ai") {
      const updated = await prisma.whatsAppConversation.update({
        where: { id: conversation.id },
        data: { status: "AI_ACTIVE" },
        include: { lead: true, messages: { orderBy: { createdAt: "asc" } } },
      });
      return jsonOk({ conversation: updated });
    }

    if (data.action === "send_owner") {
      if (!data.content?.trim()) return jsonError("Message required");
      await prisma.whatsAppMessage.create({
        data: {
          conversationId: conversation.id,
          direction: "outbound",
          sender: "OWNER",
          content: data.content.trim(),
        },
      });
      const updated = await prisma.whatsAppConversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date(), status: "MANUAL" },
        include: { lead: true, messages: { orderBy: { createdAt: "asc" } } },
      });
      return jsonOk({ conversation: updated });
    }

    // simulate_reply — lead inbound + AI response
    const inbound =
      data.content?.trim() ||
      pick([
        "What's the price for a starter package?",
        "When are you available this week?",
        "Yes I'm interested, can I book?",
        "Still thinking about it.",
      ]);

    await prisma.whatsAppMessage.create({
      data: {
        conversationId: conversation.id,
        direction: "inbound",
        sender: "LEAD",
        content: inbound,
      },
    });

    const scored = scoreInboundMessage(inbound, conversation.leadScore);
    const newScore = Math.max(0, Math.min(100, conversation.leadScore + scored.leadScoreDelta));

    if (conversation.status === "AI_ACTIVE") {
      await prisma.whatsAppMessage.create({
        data: {
          conversationId: conversation.id,
          direction: "outbound",
          sender: "AI",
          content: scored.content,
        },
      });
    }

    await prisma.lead.update({
      where: { id: conversation.leadId },
      data: {
        score: newScore,
        status: scored.suggestedStatus,
        engagementLevel: newScore >= 70 ? "high" : newScore >= 40 ? "medium" : "low",
        lastActivityAt: new Date(),
        category: scored.readyForConversion ? "hot" : conversation.lead.category,
      },
    });

    const updated = await prisma.whatsAppConversation.update({
      where: { id: conversation.id },
      data: {
        leadScore: newScore,
        sentiment: scored.sentiment,
        readyForConversion: scored.readyForConversion,
        lastMessageAt: new Date(),
      },
      include: { lead: true, messages: { orderBy: { createdAt: "asc" } } },
    });

    if (scored.readyForConversion) {
      await prisma.notification.create({
        data: {
          userId: session.id,
          type: "conversion_ready",
          title: "Lead ready to convert",
          message: `${conversation.lead.name} is conversion-ready (score ${newScore}).`,
        },
      });
    }

    return jsonOk({ conversation: updated, scored });
  } catch (error) {
    return handleApiError(error);
  }
}

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}
