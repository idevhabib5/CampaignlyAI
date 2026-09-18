import { MarketingFooter, MarketingNav } from "@/components/marketing-shell";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-hero-mesh">
      <MarketingNav />
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-4xl font-semibold text-teal-950">Terms</h1>
        <p className="mt-4 text-sm text-slate-700">
          Campaignly.AI POC is provided for demonstration and academic evaluation. Meta campaign
          approval cannot be guaranteed by the platform (LI-2). External API calls are mocked unless
          credentials are configured. Not a commercial service agreement.
        </p>
      </div>
      <MarketingFooter />
    </div>
  );
}
