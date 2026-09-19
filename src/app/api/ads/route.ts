export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { generateAdContent, isLiveAdsAiConfigured } from "@/lib/services/ai";

export async function GET() {
  try {
    const session = await requireSession();
    const creatives = await prisma.adCreative.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
    });
    return jsonOk({
      creatives,
      aiMode: isLiveAdsAiConfigured() ? "live" : "mock_or_unconfigured",
      providers: {
        gemini: Boolean(
          process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_AI_API_KEY?.trim()
        ),
        groq: Boolean(process.env.GROQ_API_KEY?.trim()),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

const generateSchema = z.object({
  objective: z.string().optional(),
  ageMin: z.number().optional(),
  ageMax: z.number().optional(),
  gender: z.string().optional(),
  templateId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = generateSchema.parse(await req.json());
    const business = await prisma.businessProfile.findUnique({ where: { userId: session.id } });
    if (!business?.onboardingComplete && !business?.businessName) {
      return jsonError("Complete onboarding before generating ads", 400);
    }
    if (!business) return jsonError("Business profile required", 400);

    const templateId =
      body.templateId || `${business.industry.toLowerCase().replace(/\s+/g, "-")}-lead-gen`;

    // RAG-style retrieval: high-compliance ads from SQLite (prefer matching template)
    const sameTemplate = await prisma.adCreative.findMany({
      where: {
        complianceScore: { gte: 85 },
        templateId,
      },
      orderBy: { complianceScore: "desc" },
      take: 5,
      select: {
        id: true,
        headline: true,
        primaryText: true,
        complianceScore: true,
        templateId: true,
      },
    });

    let ragPool = sameTemplate;
    if (ragPool.length < 5) {
      const extras = await prisma.adCreative.findMany({
        where: {
          complianceScore: { gte: 85 },
          id: { notIn: sameTemplate.map((a) => a.id) },
        },
        orderBy: { complianceScore: "desc" },
        take: 5 - ragPool.length,
        select: {
          id: true,
          headline: true,
          primaryText: true,
          complianceScore: true,
          templateId: true,
        },
      });
      ragPool = [...ragPool, ...extras];
    }

    const ragExamples = ragPool.map(({ headline, primaryText, complianceScore, templateId: tid }) => ({
      headline,
      primaryText,
      complianceScore,
      templateId: tid,
    }));

    const generated = await generateAdContent({
      businessName: business.businessName,
      industry: business.industry,
      brandTone: business.brandTone,
      communicationStyle: business.communicationStyle,
      targetAudience: business.targetAudience,
      services: business.services,
      location: business.location,
      objective: body.objective,
      ageMin: body.ageMin,
      ageMax: body.ageMax,
      gender: body.gender,
      templateId,
      ragExamples,
    });

    const creative = await prisma.adCreative.create({
      data: {
        userId: session.id,
        headline: generated.headline,
        primaryText: generated.primaryText,
        description: generated.description,
        cta: generated.cta,
        variations: JSON.stringify(generated.variations),
        audienceConfig: JSON.stringify({
          ageMin: body.ageMin ?? 25,
          ageMax: body.ageMax ?? 45,
          gender: body.gender ?? "all",
          objective: body.objective ?? "LEAD_GENERATION",
        }),
        complianceScore: generated.complianceScore,
        complianceNotes: generated.complianceNotes,
        status: "ready",
        templateId,
      },
    });

    return jsonOk({
      creative,
      ragInsights: generated.ragInsights,
      recommendations: generated.recommendations,
      policyChecks: generated.policyChecks || [],
      ragExampleCount: ragExamples.length,
      source: generated.source,
      model: generated.model || null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

const deleteSchema = z.object({
  id: z.string().min(1),
});

export async function DELETE(req: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const idFromQuery = searchParams.get("id");
    const body = idFromQuery ? { id: idFromQuery } : deleteSchema.parse(await req.json());
    const id = body.id;

    const existing = await prisma.adCreative.findFirst({
      where: { id, userId: session.id },
    });
    if (!existing) return jsonError("Ad not found", 404);

    await prisma.adCreative.delete({ where: { id } });
    return jsonOk({ deleted: true, id });
  } catch (error) {
    return handleApiError(error);
  }
}
