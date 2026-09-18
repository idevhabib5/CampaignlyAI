export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonOk } from "@/lib/api";
import { getOnboardingRecommendations } from "@/lib/services/ai";

const schema = z.object({
  step: z.number().int().min(1).max(5).optional(),
  businessName: z.string().min(2).optional(),
  industry: z.string().optional(),
  category: z.string().optional(),
  brandTone: z.string().optional(),
  communicationStyle: z.string().optional(),
  targetAudience: z.string().optional(),
  website: z.string().optional(),
  location: z.string().optional(),
  services: z.string().optional(),
  brandColors: z.string().optional(),
  complete: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await requireSession();
    const business = await prisma.businessProfile.findUnique({ where: { userId: session.id } });
    return jsonOk({ business });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: Request) {
  try {
    const session = await requireSession();
    const data = schema.parse(await req.json());

    const existing = await prisma.businessProfile.findUnique({ where: { userId: session.id } });

    let aiRecommendations = existing?.aiRecommendations || null;
    if (data.industry && data.businessName) {
      const recs = await getOnboardingRecommendations(data.industry, data.businessName);
      aiRecommendations = JSON.stringify(recs);
    } else if (data.industry && existing?.businessName) {
      const recs = await getOnboardingRecommendations(data.industry, existing.businessName);
      aiRecommendations = JSON.stringify(recs);
    }

    const payload = {
      businessName: data.businessName ?? existing?.businessName ?? "My Business",
      industry: data.industry ?? existing?.industry ?? "Local Services",
      category: data.category ?? existing?.category,
      brandTone: data.brandTone ?? existing?.brandTone ?? "professional",
      communicationStyle: data.communicationStyle ?? existing?.communicationStyle ?? "friendly",
      targetAudience: data.targetAudience ?? existing?.targetAudience,
      website: data.website ?? existing?.website,
      location: data.location ?? existing?.location,
      services: data.services ?? existing?.services,
      brandColors: data.brandColors ?? existing?.brandColors,
      onboardingStep: data.step ?? existing?.onboardingStep ?? 1,
      onboardingComplete: data.complete ?? existing?.onboardingComplete ?? false,
      aiRecommendations,
    };

    const business = existing
      ? await prisma.businessProfile.update({ where: { userId: session.id }, data: payload })
      : await prisma.businessProfile.create({ data: { userId: session.id, ...payload } });

    return jsonOk({ business });
  } catch (error) {
    return handleApiError(error);
  }
}
