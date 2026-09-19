export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { randomBytes } from "crypto";
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

const resetRequestSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(6),
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

    if (action === "google") {
      // Mock Google OAuth — no real Google credentials required
      const email = "google.demo@campaignly.ai";
      let user = await prisma.user.findUnique({
        where: { email },
        include: { business: true },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: "Google Demo User",
            passwordHash: await hashPassword(randomBytes(16).toString("hex")),
            role: "OWNER",
            subscription: {
              create: {
                plan: "TRIAL",
                status: "TRIALING",
                trialEndsAt: new Date(Date.now() + 14 * 86400000),
              },
            },
            business: {
              create: {
                businessName: "Google Demo Studio",
                industry: "Fitness",
                onboardingStep: 1,
                onboardingComplete: false,
              },
            },
          },
          include: { business: true },
        });
      }

      const token = await createSessionToken({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
      await setSessionCookie(token);

      const redirectTo = user.business?.onboardingComplete ? "/dashboard" : "/onboarding";
      return jsonOk({
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        redirectTo,
        mock: true,
        message: "Signed in with mock Google OAuth",
      });
    }

    if (action === "request_password_reset") {
      const data = resetRequestSchema.parse(body);
      const email = data.email.toLowerCase();
      const user = await prisma.user.findUnique({ where: { email } });

      // Always succeed for demo UX (don't leak whether email exists)
      if (!user) {
        return jsonOk({
          message: "If that email exists, a reset link is ready below.",
          resetLink: null,
        });
      }

      const token = randomBytes(24).toString("hex");
      await prisma.passwordResetToken.create({
        data: {
          email,
          token,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const resetLink = `${base}/reset-password?token=${token}`;

      return jsonOk({
        message: "Password reset ready (demo — no email sent). Use the link below.",
        resetLink,
        token,
      });
    }

    if (action === "reset_password") {
      const data = resetPasswordSchema.parse(body);
      const record = await prisma.passwordResetToken.findUnique({ where: { token: data.token } });
      if (!record || record.used || record.expiresAt < new Date()) {
        return jsonError("Invalid or expired reset token", 400);
      }

      const user = await prisma.user.findUnique({ where: { email: record.email } });
      if (!user) return jsonError("User not found", 404);

      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: await hashPassword(data.password) },
      });
      await prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { used: true },
      });

      return jsonOk({ message: "Password updated. You can sign in now." });
    }

    return jsonError("Unknown action");
  } catch (error) {
    return handleApiError(error);
  }
}
