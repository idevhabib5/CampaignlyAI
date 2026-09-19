export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { DEMO_INBOUND_SAMPLES, scoreInboundMessage } from "@/lib/services/whatsapp";

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
  conversationId: z.string().optional(),
  action: z.enum([
    "simulate_reply",
    "takeover",
    "release_to_ai",
    "send_owner",
    "run_followups",
  ]),
  content: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const data = messageSchema.parse(await req.json());

    if (data.action === "run_followups") {
      const due = await prisma.whatsAppConversation.findMany({
        where: {
          userId: session.id,
          status: { in: ["AI_ACTIVE", "MANUAL"] },
          readyForConversion: false,
        },
        include: { lead: true, messages: true },
      });

      const now = Date.now();
      let processed = 0;
      const results: Array<{ id: string; name: string; delayHours: number }> = [];

      for (const conversation of due) {
        const delayMs = Math.max(1, conversation.followUpDelayHours || 24) * 60 * 60 * 1000;
        const dueAt = new Date(conversation.lastMessageAt).getTime() + delayMs;
        // Demo simulator: treat conversations as due if delay window has elapsed OR force tick for demo
        const forceDemoTick = true;
        if (!forceDemoTick && dueAt > now) continue;

        const followUp =
          conversation.leadScore >= 60
            ? `Hi ${conversation.lead.name.split(" ")[0]}, just checking in — still interested in booking? I can hold a spot for you.`
            : `Hi ${conversation.lead.name.split(" ")[0]}, wanted to follow up on your enquiry. Happy to answer any questions.`;

        await prisma.whatsAppMessage.create({
          data: {
            conversationId: conversation.id,
            direction: "outbound",
            sender: conversation.status === "MANUAL" ? "OWNER" : "AI",
            content: followUp,
          },
        });

        await prisma.whatsAppConversation.update({
          where: { id: conversation.id },
          data: {
            lastMessageAt: new Date(),
            followUpDelayHours: conversation.leadScore >= 60 ? 4 : 24,
          },
        });

        await prisma.lead.update({
          where: { id: conversation.leadId },
          data: { lastActivityAt: new Date() },
        });

        processed += 1;
        results.push({
          id: conversation.id,
          name: conversation.lead.name,
          delayHours: conversation.followUpDelayHours,
        });
      }

      await prisma.notification.create({
        data: {
          userId: session.id,
          type: "jobs",
          title: "Follow-up jobs ran",
          message: `Mock BullMQ tick processed ${processed} WhatsApp follow-up(s).`,
        },
      });

      const conversations = await prisma.whatsAppConversation.findMany({
        where: { userId: session.id },
        include: {
          lead: true,
          messages: { orderBy: { createdAt: "asc" } },
        },
        orderBy: { lastMessageAt: "desc" },
      });

      return jsonOk({
        processed,
        results,
        conversations,
        message: `Ran follow-up jobs for ${processed} conversation(s).`,
      });
    }

    if (!data.conversationId) return jsonError("conversationId required");

    const conversation = await prisma.whatsAppConversation.findFirst({
      where: { id: data.conversationId, userId: session.id },
      include: {
        lead: true,
        messages: true,
      },
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

    // simulate_reply — inbound + intent/sentiment scoring + AI response
    const inbound = data.content?.trim() || pick(DEMO_INBOUND_SAMPLES);

    await prisma.whatsAppMessage.create({
      data: {
        conversationId: conversation.id,
        direction: "inbound",
        sender: "LEAD",
        content: inbound,
      },
    });

    const scored = scoreInboundMessage(inbound, conversation.leadScore, {
      priorMessageCount: conversation.messages.length + 1,
    });

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
        score: scored.leadScore,
        status: scored.suggestedStatus,
        engagementLevel:
          scored.leadScore >= 70 ? "high" : scored.leadScore >= 40 ? "medium" : "low",
        lastActivityAt: new Date(),
        category: scored.readyForConversion
          ? "hot"
          : scored.intent === "rejection"
            ? "cold"
            : conversation.lead.category,
      },
    });

    const updated = await prisma.whatsAppConversation.update({
      where: { id: conversation.id },
      data: {
        leadScore: scored.leadScore,
        sentiment: scored.sentiment,
        intent: scored.intent,
        intentConfidence: scored.intentConfidence,
        scoringBreakdown: JSON.stringify({
          intentLabel: scored.intentLabel,
          sentimentScore: scored.sentimentScore,
          behavioralSignals: scored.behavioralSignals,
          scoringBreakdown: scored.scoringBreakdown,
          leadScoreDelta: scored.leadScoreDelta,
          followUpDelayHours: scored.followUpDelayHours,
          escalateToOwner: scored.escalateToOwner,
        }),
        readyForConversion: scored.readyForConversion,
        escalateToOwner: scored.escalateToOwner,
        followUpDelayHours: scored.followUpDelayHours,
        lastMessageAt: new Date(),
        status:
          scored.intent === "rejection"
            ? "CLOSED"
            : scored.escalateToOwner && scored.readyForConversion
              ? conversation.status
              : conversation.status,
      },
      include: { lead: true, messages: { orderBy: { createdAt: "asc" } } },
    });

    if (scored.readyForConversion) {
      await prisma.notification.create({
        data: {
          userId: session.id,
          type: "conversion_ready",
          title: "Lead ready to convert",
          message: `${conversation.lead.name} scored ${scored.leadScore} with intent “${scored.intentLabel}”. Take over in WhatsApp.`,
        },
      });
    } else if (scored.escalateToOwner && scored.intent === "rejection") {
      await prisma.notification.create({
        data: {
          userId: session.id,
          type: "lead",
          title: "Lead opted out",
          message: `${conversation.lead.name} rejected follow-ups. Conversation closed.`,
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
