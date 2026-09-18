export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { generateAdContent } from "@/lib/services/ai";

export async function GET() {
  try {
    const session = await requireSession();
    const creatives = await prisma.adCreative.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
    });
    return jsonOk({ creatives });
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
        templateId: body.templateId || `${business.industry.toLowerCase()}-lead-gen`,
      },
    });

    return jsonOk({
      creative,
      ragInsights: generated.ragInsights,
      recommendations: generated.recommendations,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
