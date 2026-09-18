import { clearSessionCookie, getSession } from "@/lib/auth";
import { handleApiError, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return jsonOk({ user: null });
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        business: true,
        subscription: true,
      },
    });
    return jsonOk({ user });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE() {
  try {
    await clearSessionCookie();
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
