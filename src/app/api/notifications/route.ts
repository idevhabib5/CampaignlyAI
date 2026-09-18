import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonOk } from "@/lib/api";
import { z } from "zod";

export async function GET() {
  try {
    const session = await requireSession();
    const notifications = await prisma.notification.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    return jsonOk({ notifications });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireSession();
    const body = z
      .object({ id: z.string().optional(), markAll: z.boolean().optional() })
      .parse(await req.json());

    if (body.markAll) {
      await prisma.notification.updateMany({
        where: { userId: session.id, read: false },
        data: { read: true },
      });
    } else if (body.id) {
      await prisma.notification.updateMany({
        where: { id: body.id, userId: session.id },
        data: { read: true },
      });
    }
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
