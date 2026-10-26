import { Badge, Button, Card, Chip, OwnerShell, PageHeader, Progress, SectionTitle } from "@/components/srs/kit";
import { cn } from "@/lib/utils";

const plans = [
  { name: "Free Trial", price: "A$0", note: "14 days · card required", copy: 20, img: "5", vid: "1", camp: 1, current: true },
  { name: "Starter", price: "A$49", note: "or A$490 / year", copy: 40, img: "Upload and edit only", vid: "—", camp: 3 },
  { name: "Growth", price: "A$99", note: "or A$990 / year", copy: 150, img: "40", vid: "8", camp: 10, popular: true },
  { name: "Pro", price: "A$179", note: "or A$1,790 / year", copy: 400, img: "120", vid: "25", camp: 30 },
];

export default function M15() {
  return (
    <OwnerShell active="Billing">
      <PageHeader
        title="Billing & subscriptions"
        subtitle="Prices in AUD including GST. Meta ad spend is charged separately by Meta in your ad account currency."
        actions={<Button variant="secondary">Billing portal (Stripe)</Button>}
      />
      <Card ai className="mb-5">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <Badge tone="warning">Trial · 5 days left</Badge>
            <p className="mt-2 text-sm text-slate-700">
              Your trial ends on <strong>30 Oct 2026</strong>. Growth (monthly, A$99) starts automatically unless you change or cancel.
            </p>
          </div>
          <div className="grid w-full max-w-md grid-cols-3 gap-4 text-xs">
            {(
              [
                ["Copy credits", 14, 20],
                ["Image credits", 3, 5],
                ["Video credits", 0, 1],
              ] as const
            ).map(([l, u, t]) => (
              <div key={l}>
                <div className="mb-1 flex justify-between text-slate-600">
                  <span>{l}</span>
                  <span className="font-semibold text-slate-800">
                    {u}/{t}
                  </span>
                </div>
                <Progress value={(u / t) * 100} />
              </div>
            ))}
          </div>
        </div>
      </Card>
      <div className="mb-4 flex items-center gap-2">
        <Chip selected>Monthly</Chip>
        <Chip>Annual · pay 10 months</Chip>
      </div>
      <div className="grid gap-4 lg:grid-cols-4">
        {plans.map((p) => (
          <Card key={p.name} className={cn(p.current && "border-2 border-teal-700")}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-700">{p.name}</div>
              {p.current && <Badge tone="ai">Current</Badge>}
              {p.popular && <Badge tone="hot">Most popular</Badge>}
            </div>
            <div className="mt-2 font-display text-3xl font-semibold text-teal-950">
              {p.price}
              <span className="font-sans text-xs font-medium text-slate-500">{p.current ? "" : " / month"}</span>
            </div>
            <div className="text-xs text-slate-500">{p.note}</div>
            <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
              <li>✓ {p.copy} ad copy generations</li>
              <li>✓ Images: {p.img}</li>
              <li>{p.vid === "—" ? "✕ No video generation" : `✓ Videos: ${p.vid}`}</li>
              <li>
                ✓ {p.camp} active campaign{p.camp > 1 ? "s" : ""}
              </li>
              <li>✓ Leads, WhatsApp agent, analytics</li>
            </ul>
            <Button className="mt-5 w-full" variant={p.current ? "secondary" : "primary"}>
              {p.current ? "Current plan" : `Choose ${p.name}`}
            </Button>
          </Card>
        ))}
      </div>
      <Card className="mt-5">
        <SectionTitle>If a payment fails</SectionTitle>
        <p className="mt-1 text-sm text-slate-600">
          Past-due, cancelled or ended-trial accounts become read-only: you can view campaigns, leads and conversations, but cannot generate content, change campaigns
          or send WhatsApp messages until billing is resolved. Running Meta ads are not paused by Campaignly; manage them in Meta if urgent.
        </p>
      </Card>
    </OwnerShell>
  );
}
