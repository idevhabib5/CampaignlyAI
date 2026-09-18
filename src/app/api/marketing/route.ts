import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { runCampaignDiagnostic } from "@/lib/services/ai";

const contactSchema = z.object({
  type: z.literal("contact"),
  name: z.string().min(2),
  email: z.string().email(),
  company: z.string().optional(),
  message: z.string().min(5),
});

const diagnosticSchema = z.object({
  type: z.literal("diagnostic"),
  businessName: z.string().min(2),
  industry: z.string().min(2),
  email: z.string().email(),
  monthlySpend: z.number().optional(),
  hasCreativeProcess: z.boolean().optional(),
  tracksLeads: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.type === "contact") {
      const data = contactSchema.parse(body);
      const enquiry = await prisma.contactEnquiry.create({
        data: {
          name: data.name,
          email: data.email,
          company: data.company,
          message: data.message,
          source: "contact",
        },
      });
      return jsonOk({ enquiry, message: "Thanks — we'll be in touch shortly." });
    }

    if (body.type === "diagnostic") {
      const data = diagnosticSchema.parse(body);
      const result = await runCampaignDiagnostic({
        industry: data.industry,
        monthlySpend: data.monthlySpend,
        hasCreativeProcess: data.hasCreativeProcess,
        tracksLeads: data.tracksLeads,
      });
      const saved = await prisma.diagnosticResult.create({
        data: {
          businessName: data.businessName,
          industry: data.industry,
          email: data.email,
          monthlySpend: data.monthlySpend,
          score: result.score,
          recommendations: JSON.stringify(result.recommendations),
        },
      });
      return jsonOk({ result: saved, recommendations: result.recommendations, score: result.score });
    }

    return jsonError("Unknown type", 400);
  } catch (error) {
    return handleApiError(error);
  }
}
