import { Badge, Button, Card, Chip, OwnerShell, PageHeader } from "@/components/srs/kit";

const industries = ["All", "Fitness", "Ecommerce", "Restaurants", "Beauty", "Real estate", "Coaching", "Healthcare", "Education", "Local services"];
const templates = [
  ["Fitness lead gen", "Fitness · Free trial sign-ups", "Leads", "Best fit"],
  ["Class timetable promo", "Fitness · Weekly classes", "Traffic", "Good fit"],
  ["Member referral", "Fitness · Bring a friend", "Engagement", "Good fit"],
  ["Ecommerce promo", "Ecommerce · Seasonal sale", "Sales", ""],
  ["Restaurant booking", "Restaurants · Table reservations", "Leads", ""],
  ["Beauty booking", "Beauty · Salon appointments", "Leads", ""],
  ["Real estate open home", "Real estate · Special ad category", "Leads", ""],
  ["Coaching discovery call", "Coaching · Book a call", "Leads", ""],
  ["Local services quote", "Local services · Request a quote", "Leads", ""],
];

export default function M05() {
  return (
    <OwnerShell active="Ads">
      <PageHeader
        title="Campaign templates"
        subtitle="Industry templates pre-fill the ad brief with an objective, tone and call to action. You can edit everything before generating."
      />
      <div className="mb-5 flex flex-wrap gap-2">
        {industries.map((i) => (
          <Chip key={i} selected={i === "Fitness"}>
            {i}
          </Chip>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {templates.map(([t, d, o, f]) => (
          <Card key={t} className={f === "Best fit" ? "border-2 border-teal-700 p-4" : "p-4"}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold text-teal-950">{t}</div>
                <div className="text-xs text-slate-500">{d}</div>
              </div>
              {f && <Badge tone={f === "Best fit" ? "ai" : "draft"}>{f}</Badge>}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Objective: <span className="font-semibold text-slate-700">{o}</span>
              </span>
              <Button size="sm" variant={f === "Best fit" ? "primary" : "secondary"}>
                Use template
              </Button>
            </div>
          </Card>
        ))}
      </div>
      <p className="mt-4 text-xs text-slate-500">Fit is ranked for your business industry. Real estate, employment and credit templates apply Meta special ad category limits.</p>
    </OwnerShell>
  );
}
