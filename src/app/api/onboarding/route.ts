export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { getOnboardingRecommendations, isLiveOnboardingAiConfigured } from "@/lib/services/ai";

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
  logoUrl: z.string().optional(),
  complete: z.boolean().optional(),
  /** When true, call OpenAI and refresh stored recommendations */
  refreshRecommendations: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await requireSession();
    const business = await prisma.businessProfile.findUnique({ where: { userId: session.id } });
    const liveAi = isLiveOnboardingAiConfigured();
    return jsonOk({
      business,
      aiMode: liveAi ? "live" : "mock_or_unconfigured",
      providers: {
        gemini: Boolean(process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_AI_API_KEY?.trim()),
        groq: Boolean(process.env.GROQ_API_KEY?.trim()),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: Request) {
  try {
    const session = await requireSession();
    const data = schema.parse(await req.json());

    const existing = await prisma.businessProfile.findUnique({ where: { userId: session.id } });

    const businessName = data.businessName ?? existing?.businessName ?? "My Business";
    const industry = data.industry ?? existing?.industry ?? "Local Services";
    const category = data.category ?? existing?.category ?? null;
    const brandTone = data.brandTone ?? existing?.brandTone ?? "professional";
    const communicationStyle =
      data.communicationStyle ?? existing?.communicationStyle ?? "friendly";
    const targetAudience = data.targetAudience ?? existing?.targetAudience ?? null;
    const website = data.website ?? existing?.website ?? null;
    const location = data.location ?? existing?.location ?? null;
    const services = data.services ?? existing?.services ?? null;
    const brandColors = data.brandColors ?? existing?.brandColors ?? null;
    const logoUrl = data.logoUrl ?? existing?.logoUrl ?? null;

    const shouldRefreshAi =
      Boolean(data.refreshRecommendations) ||
      Boolean(data.complete) ||
      (!existing?.aiRecommendations && (data.step === 4 || data.complete));

    let aiRecommendations = existing?.aiRecommendations || null;
    if (shouldRefreshAi) {
      try {
        const recs = await getOnboardingRecommendations({
          businessName,
          industry,
          category,
          brandTone,
          communicationStyle,
          targetAudience,
          location,
          services,
          website,
        });
        aiRecommendations = JSON.stringify(recs);
      } catch (err) {
        if (data.refreshRecommendations || data.complete) {
          const message = err instanceof Error ? err.message : "AI recommendations failed";
          return jsonError(message, 502);
        }
      }
    }

    const payload = {
      businessName,
      industry,
      category,
      brandTone,
      communicationStyle,
      targetAudience,
      website,
      location,
      services,
      brandColors,
      logoUrl,
      onboardingStep: data.step ?? existing?.onboardingStep ?? 1,
      onboardingComplete:
        data.complete === true
          ? true
          : data.complete === false
            ? false
            : (existing?.onboardingComplete ?? false),
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
