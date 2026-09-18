import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  createSessionToken,
  hashPassword,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  businessName: z.string().min(2).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action as string;

    if (action === "register") {
      const data = registerSchema.parse(body);
      const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
      if (existing) return jsonError("Email already registered", 409);

      const user = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email.toLowerCase(),
          passwordHash: await hashPassword(data.password),
          role: "OWNER",
          subscription: {
            create: {
              plan: "TRIAL",
              status: "TRIALING",
              trialEndsAt: new Date(Date.now() + 14 * 86400000),
            },
          },
          ...(data.businessName
            ? {
                business: {
                  create: {
                    businessName: data.businessName,
                    industry: "Local Services",
                    onboardingStep: 1,
                    onboardingComplete: false,
                  },
                },
              }
            : {}),
        },
      });

      const token = await createSessionToken({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
      await setSessionCookie(token);

      return jsonOk({
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        redirectTo: "/onboarding",
      });
    }

    if (action === "login") {
      const data = loginSchema.parse(body);
      const user = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
        include: { business: true },
      });
      if (!user || !(await verifyPassword(data.password, user.passwordHash))) {
        return jsonError("Invalid email or password", 401);
      }

      const token = await createSessionToken({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
      await setSessionCookie(token);

      const redirectTo =
        user.role === "ADMIN"
          ? "/admin"
          : user.business?.onboardingComplete
            ? "/dashboard"
            : "/onboarding";

      return jsonOk({
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        redirectTo,
      });
    }

    return jsonError("Unknown action");
  } catch (error) {
    return handleApiError(error);
  }
}
