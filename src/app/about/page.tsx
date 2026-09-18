import { MarketingFooter, MarketingNav } from "@/components/marketing-shell";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-hero-mesh">
      <MarketingNav />
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-4xl font-semibold text-teal-950">About Campaignly.AI</h1>
        <p className="mt-4 text-slate-700">
          Campaignly.AI is an AI-powered SaaS platform that automates Meta (Facebook & Instagram)
          advertising for businesses across fitness, ecommerce, real estate, beauty, healthcare,
          education, and local services.
        </p>
        <p className="mt-4 text-slate-700">
          This repository is a functional proof of concept based on the COMSATS University project
          proposal (FA23-BCS-045 / FA23-BCS-116). Core journeys — onboarding, AI ad generation,
          campaign deployment, lead management, WhatsApp nurturing, billing, and admin ops — are
          demonstrable end-to-end with mocked external integrations.
        </p>
      </div>
      <MarketingFooter />
    </div>
  );
}
