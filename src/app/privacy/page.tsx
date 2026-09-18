import { MarketingFooter, MarketingNav } from "@/components/marketing-shell";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-hero-mesh">
      <MarketingNav />
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-4xl font-semibold text-teal-950">Privacy</h1>
        <p className="mt-4 text-sm text-slate-700">
          This POC stores demo account data locally in SQLite. Lead contact fields are stored for
          demonstration of the lead management module. Production would encrypt sensitive lead PII
          (scope FE-3), use JWT session isolation, and follow Meta/WhatsApp data handling policies.
          Do not upload real customer PII to this demo environment.
        </p>
      </div>
      <MarketingFooter />
    </div>
  );
}
