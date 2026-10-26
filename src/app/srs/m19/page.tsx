import { Badge, Button, Card, SiteFooter, SiteNav } from "@/components/srs/kit";

const industries = ["Fitness", "Ecommerce", "Restaurants", "Beauty", "Real estate", "Coaching", "Healthcare", "Education", "Local services"];

export default function M19() {
  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <SiteNav />
      <section className="bg-hero-mesh">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-2">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-teal-700">Meta ads automation for every industry</div>
            <h1 className="mt-3 font-display text-5xl font-semibold leading-tight tracking-tight text-teal-950">
              From business profile to a ready WhatsApp lead, in one guided flow.
            </h1>
            <p className="mt-4 text-slate-600">
              Generate policy-checked Facebook and Instagram ads, launch them without Ads Manager, and let an AI assistant follow up every lead on WhatsApp.
            </p>
            <div className="mt-6 flex gap-3">
              <Button size="lg">Start 14-day free trial</Button>
              <Button size="lg" variant="secondary">
                Free campaign diagnostic
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {industries.map((i) => (
                <Badge key={i} tone="ai">
                  {i}
                </Badge>
              ))}
            </div>
          </div>
          <Card className="p-4 shadow-lg">
            <div className="grid grid-cols-3 gap-3">
              {[
                ["Active campaigns", "3"],
                ["Leads this week", "27"],
                ["Ready leads", "6"],
              ].map(([l, v]) => (
                <div key={l} className="rounded-lg bg-teal-50 p-3">
                  <div className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500">{l}</div>
                  <div className="font-display text-2xl font-semibold text-teal-950">{v}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 grid h-40 place-items-center rounded-lg bg-gradient-to-br from-teal-700 to-teal-500 font-display text-xl text-white">
              AI-generated ad preview
            </div>
            <div className="mt-3 rounded-lg border border-[var(--line)] p-3 text-xs text-slate-700">
              <span className="font-semibold">WhatsApp agent:</span> “Hi Casey! A free trial class is available Saturday 10 am. Shall I book it?”
            </div>
          </Card>
        </div>
      </section>
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="font-display text-3xl font-semibold text-teal-950">How it works</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-4">
            {[
              ["1. Set up your business", "Name, offer, audience, tone and location."],
              ["2. Generate and check ads", "AI drafts with an internal Meta-rules check."],
              ["3. Launch on Meta", "Choose an objective, budget and location, then confirm."],
              ["4. Nurture on WhatsApp", "Leads are scored 0–100 and you can take over at any time."],
            ].map(([t, d]) => (
              <div key={t} className="border-t-2 border-teal-700 pt-4">
                <div className="font-semibold text-teal-950">{t}</div>
                <div className="mt-1 text-sm text-slate-600">{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-[#0b3b37] text-teal-50">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-semibold">Customer stories</h2>
            <p className="mt-4 text-sm leading-relaxed text-teal-50/90">
              “We set up our first lead campaign in an afternoon and stopped losing WhatsApp enquiries overnight.”
            </p>
            <div className="mt-2 text-xs text-teal-200/70">Sample testimonial · Studio owner, Beauty · results vary</div>
          </div>
          <div>
            <h2 className="font-display text-3xl font-semibold">From the blog</h2>
            <div className="mt-4 space-y-3">
              {[
                ["Choosing the right Meta objective for your goal", "12 Oct 2026"],
                ["Special ad categories explained for real estate", "3 Oct 2026"],
              ].map(([t, d]) => (
                <div key={t} className="rounded-lg border border-teal-800 bg-teal-900/40 p-3">
                  <div className="text-sm font-semibold">{t}</div>
                  <div className="text-xs text-teal-200/70">{d} · 5 min read</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
