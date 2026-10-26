import { Badge, Card, Chip, OwnerShell, PageHeader, SectionTitle } from "@/components/srs/kit";

const metrics = [
  ["Impressions", "25,620"],
  ["Clicks", "822"],
  ["CTR", "3.2%"],
  ["Leads", "81"],
  ["Cost per lead", "A$6.40"],
  ["Spend", "A$518"],
  ["Converted", "16"],
  ["Conversion rate", "19.8%"],
];
const weeks = [
  ["W1", 12, 96],
  ["W2", 17, 118],
  ["W3", 23, 142],
  ["W4", 29, 162],
] as const;

export default function M13() {
  return (
    <OwnerShell active="Campaigns">
      <PageHeader
        title="Campaign analytics"
        subtitle="Results across all campaigns. Meta metrics last synced today at 10:40; conversions come from lead statuses in Campaignly."
        actions={
          <div className="flex gap-2">
            <Chip>7 days</Chip>
            <Chip selected>30 days</Chip>
            <Chip>90 days</Chip>
          </div>
        }
      />
      <Card ai className="mb-5">
        <Badge tone="ai">AI performance summary</Badge>
        <p className="mt-2 text-sm text-slate-700">
          Leads grew each week while cost per lead fell from A$8.00 to A$5.60. “Spring Trial Pass” produced 64% of leads. Consider a similar ad for weekday mornings.
        </p>
      </Card>
      <div className="grid gap-4 sm:grid-cols-4">
        {metrics.map(([l, v]) => (
          <div key={l} className="card p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{l}</div>
            <div className="mt-2 font-display text-3xl font-semibold text-teal-950">{v}</div>
          </div>
        ))}
      </div>
      <Card className="mt-5">
        <div className="flex items-center justify-between">
          <SectionTitle>Leads and spend by week</SectionTitle>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-teal-600" /> Leads
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-orange-400" /> Spend (A$)
            </span>
          </div>
        </div>
        <div className="mt-6 flex h-56 items-end gap-10 px-6">
          {weeks.map(([w, l, s]) => (
            <div key={w} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex w-full items-end justify-center gap-2">
                <div className="flex w-1/3 flex-col items-center">
                  <span className="text-xs font-semibold text-slate-600">{l}</span>
                  <div className="w-full rounded-t-md bg-teal-600" style={{ height: `${l * 5}px` }} />
                </div>
                <div className="flex w-1/3 flex-col items-center">
                  <span className="text-xs font-semibold text-slate-600">{s}</span>
                  <div className="w-full rounded-t-md bg-orange-400" style={{ height: `${s}px` }} />
                </div>
              </div>
              <span className="text-xs text-slate-500">{w}</span>
            </div>
          ))}
        </div>
      </Card>
    </OwnerShell>
  );
}
