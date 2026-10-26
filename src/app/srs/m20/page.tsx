import { Badge, Button, Card, Chip, SiteFooter, SiteNav } from "@/components/srs/kit";
import { cn } from "@/lib/utils";

const plans = [
  { name: "Starter", m: "A$49", y: "A$490", copy: 40, img: "Upload and edit only", vid: "No video generation", camp: 3 },
  { name: "Growth", m: "A$99", y: "A$990", copy: 150, img: "40 images", vid: "8 videos", camp: 10, popular: true },
  { name: "Pro", m: "A$179", y: "A$1,790", copy: 400, img: "120 images", vid: "25 videos", camp: 30 },
];

export default function M20() {
  return (
    <div className="min-h-screen bg-hero-mesh">
      <SiteNav />
      <main className="mx-auto max-w-6xl px-6 py-14">
        <h1 className="font-display text-5xl font-semibold tracking-tight text-teal-950">Pricing</h1>
        <p className="mt-2 text-slate-600">
          Prices in AUD including GST. Every plan starts with a 14-day free trial (card required). Meta ad spend is billed by Meta separately.
        </p>
        <div className="mt-6 flex gap-2">
          <Chip selected>Monthly</Chip>
          <Chip>Annual · 2 months free</Chip>
        </div>
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {plans.map((p) => (
            <Card key={p.name} className={cn("p-6", p.popular && "border-2 border-teal-700")}>
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-700">{p.name}</div>
                {p.popular && <Badge tone="hot">Most popular</Badge>}
              </div>
              <div className="mt-2 font-display text-4xl font-semibold text-teal-950">
                {p.m}
                <span className="font-sans text-sm font-medium text-slate-500"> / month</span>
              </div>
              <div className="text-xs text-slate-500">or {p.y} billed yearly</div>
              <ul className="mt-5 space-y-2 text-sm text-slate-600">
                <li>✓ {p.copy} AI ad copy generations a month</li>
                <li>✓ {p.img}</li>
                <li>
                  {p.vid.startsWith("No") ? "✕" : "✓"} {p.vid}
                </li>
                <li>✓ Up to {p.camp} active campaigns</li>
                <li>✓ Leads workspace and WhatsApp AI agent</li>
              </ul>
              <Button className="mt-6 w-full">Start free trial</Button>
            </Card>
          ))}
        </div>
        <Card className="mt-6">
          <div className="font-semibold text-teal-950">The free trial includes</div>
          <p className="mt-1 text-sm text-slate-600">
            20 ad copies, 5 images, 1 video and 1 active campaign for 14 days. You choose the plan that starts after the trial and can cancel before it renews.
          </p>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
