import { Badge, Button, Card, OwnerShell, PageHeader, SectionTitle, Spark } from "@/components/srs/kit";

const metrics = [
  ["Active campaigns", "3", "+1 this week", [2, 2, 2, 3, 3, 3, 3]],
  ["Total leads", "81", "+18% vs last 7 days", [40, 46, 52, 58, 66, 74, 81]],
  ["Cost per lead", "A$6.40", "−9% vs last 7 days", [8.1, 7.8, 7.2, 7, 6.9, 6.6, 6.4]],
  ["Conversion rate", "19.8%", "+2.1 pts", [15, 16, 16.5, 17, 18, 19, 19.8]],
  ["Ad spend", "A$518", "Charged by Meta", [60, 130, 200, 270, 350, 430, 518]],
  ["Ready leads", "12", "Score 70 or more", [4, 5, 6, 8, 9, 11, 12]],
] as const;

export default function M03() {
  return (
    <OwnerShell active="Overview">
      <PageHeader
        title="Good evening, Pulse Fit Studio"
        subtitle="Here is how your Meta advertising and lead follow-up are doing. Metrics last synced from Meta today at 10:40."
        actions={<Button>+ Create campaign</Button>}
      />
      <Card ai className="mb-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-3xl">
            <Badge tone="ai">AI recommendation · this week</Badge>
            <p className="mt-2 text-sm text-slate-700">
              “Spring Trial Pass” has the lowest cost per lead. Consider creating a similar ad set for weekday mornings. Nothing changes until you apply it.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary">View campaign</Button>
            <Button>Apply recommendation</Button>
          </div>
        </div>
      </Card>
      <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {metrics.map(([l, v, h, p]) => (
          <div key={l} className="card p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{l}</div>
            <div className="mt-2 font-display text-3xl font-semibold text-teal-950">{v}</div>
            <div className="mt-1 text-xs text-slate-500">{h}</div>
            <Spark points={[...p]} />
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_420px]">
        <Card>
          <SectionTitle>What to do next</SectionTitle>
          <div className="mt-3 space-y-2">
            {[
              ["Follow up 4 ready leads", "Leads"],
              ["Generate new ad creatives for November", "Ads"],
              ["Check approval of WhatsApp template ‘trial_reminder’", "Settings"],
              ["Create your next campaign", "Campaigns"],
            ].map(([t, m]) => (
              <div key={t} className="flex items-center justify-between rounded-lg border border-[var(--line)] px-4 py-3 text-sm">
                <span className="font-medium text-slate-800">{t}</span>
                <span className="text-xs font-semibold text-teal-700">{m} →</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <SectionTitle>Recent activity</SectionTitle>
          <div className="mt-3 space-y-3 text-sm">
            {[
              ["Campaign “Spring Trial Pass” is active in Meta", "10 min ago"],
              ["New lead: Casey Morgan (Spring Trial Pass)", "25 min ago"],
              ["Taylor Brooks reached score 82 and is Ready", "1 hr ago"],
              ["Trial ends in 5 days · Growth plan starts 30 Oct", "Today"],
            ].map(([t, a]) => (
              <div key={t} className="flex items-start gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-teal-600" />
                <div>
                  <div className="text-slate-800">{t}</div>
                  <div className="text-xs text-slate-500">{a}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </OwnerShell>
  );
}
