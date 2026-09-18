import Link from "next/link";
import { MarketingFooter, MarketingNav } from "@/components/marketing-shell";
import { ArrowRight, Bot, Megaphone, Sparkles, Users } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-hero-mesh">
      <MarketingNav />
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:pt-24">
          <div>
            <p className="font-display text-4xl font-semibold tracking-tight text-teal-950 sm:text-5xl lg:text-6xl">
              Campaignly<span className="text-orange-600">.AI</span>
            </p>
            <h1 className="mt-5 max-w-xl text-balance text-2xl font-semibold leading-snug text-teal-900 sm:text-3xl">
              Launch Meta ads, capture leads, and nurture them on WhatsApp — without Ads Manager
              expertise.
            </h1>
            <p className="mt-4 max-w-lg text-base text-slate-600">
              Guided onboarding, RAG-enhanced ad generation, automated Meta deployment, and an AI
              WhatsApp agent that tells you when a lead is ready to convert.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="btn-primary">
                Start free trial <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/diagnostic" className="btn-secondary">
                Free campaign diagnostic
              </Link>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Demo: owner@fitstudio.demo / demo1234
            </p>
          </div>
          <div className="relative">
            <div
              className="aspect-[4/3] w-full overflow-hidden rounded-none bg-cover bg-center shadow-2xl shadow-teal-900/20"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, rgba(15,118,110,0.85), rgba(12,26,26,0.55)), url('https://images.unsplash.com/photo-1611162617474-5b21e11e251f?auto=format&fit=crop&w=1400&q=80')",
              }}
            >
              <div className="flex h-full flex-col justify-end p-6 text-white sm:p-8">
                <div className="text-sm font-medium text-teal-100">Primary workflow</div>
                <div className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
                  Onboard → Generate ads → Deploy to Meta → Nurture leads
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-t border-teal-900/10 bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-display text-3xl font-semibold text-teal-950">Built for the full ad lifecycle</h2>
          <p className="mt-2 max-w-2xl text-slate-600">
            One platform for creative generation, campaign automation, lead management, and conversion.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Sparkles,
                title: "AI ad intelligence",
                body: "Industry-aware copy with mock RAG retrieval and Meta policy compliance scoring.",
              },
              {
                icon: Megaphone,
                title: "Meta automation",
                body: "Connect ad accounts, deploy campaigns, pause/activate, and sync performance metrics.",
              },
              {
                icon: Users,
                title: "Lead management",
                body: "Sync Meta lead forms, search/filter prospects, and track conversion readiness.",
              },
              {
                icon: Bot,
                title: "WhatsApp agent",
                body: "Autonomous follow-ups, intent scoring, and owner alerts when leads are hot.",
              },
            ].map((f) => (
              <div key={f.title} className="border-t-2 border-teal-700 pt-4">
                <f.icon className="h-6 w-6 text-teal-700" />
                <h3 className="mt-3 font-semibold text-teal-950">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-teal-950 py-16 text-teal-50">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h2 className="font-display text-3xl font-semibold">Ready to see it work?</h2>
            <p className="mt-2 text-teal-100/80">Use the seeded fitness studio account for a full walkthrough.</p>
          </div>
          <Link href="/login" className="btn bg-orange-500 text-white hover:bg-orange-600">
            Open demo dashboard
          </Link>
        </div>
      </section>
      <MarketingFooter />
    </div>
  );
}
