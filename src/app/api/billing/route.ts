import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonOk } from "@/lib/api";
import { applyMockWebhook, createBillingPortalSession, createCheckoutSession } from "@/lib/services/stripe";

export async function GET() {
  try {
    const session = await requireSession();
    const subscription = await prisma.subscription.findUnique({ where: { userId: session.id } });
    return jsonOk({ subscription });
  } catch (error) {
    return handleApiError(error);
  }
}

const schema = z.object({
  action: z.enum(["checkout", "portal", "complete_checkout"]),
  plan: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const data = schema.parse(await req.json());

    if (data.action === "checkout") {
      const plan = data.plan || "STARTER";
      const checkout = await createCheckoutSession(session.id, plan);
      return jsonOk({ checkout });
    }

    if (data.action === "portal") {
      const portal = await createBillingPortalSession(session.id);
      return jsonOk({ portal });
    }

    // complete_checkout — mock webhook handler
    const plan = data.plan || "STARTER";
    const applied = applyMockWebhook(plan);
    const subscription = await prisma.subscription.upsert({
      where: { userId: session.id },
      create: { userId: session.id, ...applied },
      update: applied,
    });

    await prisma.notification.create({
      data: {
        userId: session.id,
        type: "billing",
        title: "Subscription updated",
        message: `Your plan is now ${plan} (${applied.status}).`,
      },
    });

    return jsonOk({ subscription });
  } catch (error) {
    return handleApiError(error);
  }
}
