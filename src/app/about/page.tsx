import { MarketingFooter, MarketingNav } from "@/components/marketing-shell";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-hero-mesh">
      <MarketingNav />
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-4xl font-semibold text-teal-950">About</h1>
        <p className="mt-4 text-slate-700">
          Campaignly.AI is a lean MVP that automates Meta advertising and WhatsApp lead nurturing
          for SMBs. This build focuses on one end-to-end demo path with mocked integrations.
        </p>
        <Link href="/login" className="btn-primary mt-8 inline-flex">
          Try the demo
        </Link>
      </div>
      <MarketingFooter />
    </div>
  );
}
