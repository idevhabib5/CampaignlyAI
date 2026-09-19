import Image from "next/image";
import Link from "next/link";
import { MarketingFooter, MarketingNav } from "@/components/marketing-shell";
import { ArrowRight, Bot, Megaphone, Sparkles, Users } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-hero-mesh">
      <MarketingNav />
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:pt-20">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <Image
                src="/brand/logo-mark.svg"
                alt="Campaignly.AI"
                width={44}
                height={44}
                priority
              />
              <p className="font-display text-4xl font-semibold tracking-tight text-teal-950 sm:text-5xl">
                Campaignly<span className="text-orange-600">.AI</span>
              </p>
            </div>
            <h1 className="max-w-xl text-balance text-2xl font-semibold leading-snug text-teal-900 sm:text-3xl">
              From blank business profile to a conversion-ready Meta lead — in one flow.
            </h1>
            <p className="mt-4 max-w-lg text-base text-slate-600">
              Full-scope demo: onboard, AI ads, media, Meta campaigns, leads, WhatsApp nurture,
              billing, and admin — all with realistic mocks (no API keys).
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login" className="btn-primary">
                Try the demo <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/diagnostic" className="btn-secondary">
                Free diagnostic
              </Link>
            </div>
            <p className="mt-4 rounded-lg bg-white/70 px-3 py-2 text-xs text-slate-600 ring-1 ring-teal-900/10">
              Demo login: <span className="font-semibold text-teal-900">owner@fitstudio.demo</span> /{" "}
              <span className="font-semibold text-teal-900">demo1234</span>
            </p>
          </div>

          <div className="relative">
            <div className="relative aspect-[4/3] w-full overflow-hidden shadow-2xl shadow-teal-900/20">
              <Image
                src="/brand/hero-campaign.jpg"
                alt="Campaignly dashboard and campaign workflow on laptop and phone"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 560px"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-teal-950/90 via-teal-950/45 to-transparent p-6 pt-20 text-white sm:p-8">
                <div className="text-sm font-medium text-teal-100">Complete product surface</div>
                <div className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
                  Ads · Media · Meta · Leads · WhatsApp · Billing
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-t border-teal-900/10 bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-display text-3xl font-semibold text-teal-950">How it works</h2>
          <p className="mt-2 max-w-2xl text-slate-600">
            End-to-end lead machine for local businesses — every integration mocked for reliable demos.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Sparkles,
                title: "1. Generate ads",
                body: "Templates, RAG insights, and Bradley Filter compliance (mock AI).",
              },
              {
                icon: Megaphone,
                title: "2. Deploy campaign",
                body: "Connect Meta, launch lead-gen, sync metrics (mock Graph API).",
              },
              {
                icon: Users,
                title: "3. Capture leads",
                body: "Sync forms, conversion analytics, and activity timelines.",
              },
              {
                icon: Bot,
                title: "4. Nurture on WhatsApp",
                body: "Intent scoring plus simulated follow-up job ticks.",
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

      <section className="border-t border-teal-900/10 bg-teal-950 py-16 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-display text-3xl font-semibold">Results from demo studios</h2>
          <p className="mt-2 max-w-xl text-teal-100/80">
            Case-study style testimonials for stakeholder walkthroughs (sample data).
          </p>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              {
                quote:
                  "We went from blank profile to a conversion-ready lead in one afternoon — the WhatsApp intent panel is the closer.",
                name: "Alex Rivera",
                role: "Owner, Pulse Fit Studio",
              },
              {
                quote:
                  "Bradley Filter caught weak claims before we would have wasted spend. Compliance scores make reviews faster.",
                name: "Priya Shah",
                role: "Growth lead, Glow Beauty Bar",
              },
              {
                quote:
                  "Follow-up jobs mean nothing slips. Mock Meta sync still feels like a real ops dashboard for training.",
                name: "Chris Nguyen",
                role: "Agency operator",
              },
            ].map((t) => (
              <blockquote key={t.name} className="border-t border-teal-700/60 pt-4">
                <p className="text-sm leading-relaxed text-teal-50/95">&ldquo;{t.quote}&rdquo;</p>
                <footer className="mt-4 text-sm">
                  <div className="font-semibold text-white">{t.name}</div>
                  <div className="text-teal-200/80">{t.role}</div>
                </footer>
              </blockquote>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/login" className="btn-primary bg-orange-500 hover:bg-orange-400">
              Open demo dashboard
            </Link>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 rounded-lg border border-teal-600 px-4 py-2 text-sm font-medium text-teal-50 hover:bg-teal-900"
            >
              Read the blog
            </Link>
          </div>
        </div>
      </section>
      <MarketingFooter />
    </div>
  );
}
