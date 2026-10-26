import { Badge, Button, Card, Chip, OwnerShell, Row, SectionTitle, Stat } from "@/components/srs/kit";

const leads = [4, 6, 5, 8, 7, 9, 13];
const spend = [22, 25, 24, 25, 25, 25, 25];
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function M09() {
  const max = Math.max(...leads);
  return (
    <OwnerShell active="Campaigns">
      <div className="mb-1 text-xs font-semibold text-teal-700">← All campaigns</div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-semibold text-teal-950">Spring Trial Pass</h1>
            <Badge tone="active" dot>
              Active in Meta
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">Leads · Meta lead form · A$25 per day · Surry Hills NSW 5 km · last Meta sync today 10:40</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">Pause</Button>
          <Button variant="secondary">Edit</Button>
          <Button>Create similar ad</Button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-5">
        <Stat label="Spend" value="A$318" hint="Charged by Meta" />
        <Stat label="Leads" value="52" hint="+13 this week" />
        <Stat label="Cost per lead" value="A$6.12" />
        <Stat label="CTR" value="2.4%" hint="3,120 clicks" />
        <Stat label="Conversions" value="11" hint="Marked Converted" />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_380px]">
        <Card>
          <div className="flex items-center justify-between">
            <SectionTitle>Performance · last 7 days</SectionTitle>
            <div className="flex gap-2">
              <Chip selected>Leads</Chip>
              <Chip>Spend</Chip>
              <Chip>CTR</Chip>
            </div>
          </div>
          <div className="mt-5 flex h-48 items-end gap-4">
            {leads.map((l, i) => (
              <div key={days[i]} className="flex flex-1 flex-col items-center gap-2">
                <div className="text-xs font-semibold text-slate-600">{l}</div>
                <div className="w-full rounded-t-md bg-teal-600" style={{ height: `${(l / max) * 140}px` }} />
                <div className="text-xs text-slate-500">{days[i]}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-slate-500">Daily spend: {spend.map((s) => `A$${s}`).join(" · ")}</div>
        </Card>
        <div className="space-y-4">
          <Card ai>
            <Badge tone="ai">AI insight</Badge>
            <p className="mt-2 text-sm text-slate-700">
              Leads rise on weekends while cost per lead stays below A$6.50. A similar ad for Saturday classes may help. No change is made until you act.
            </p>
          </Card>
          <Card>
            <SectionTitle>Campaign details</SectionTitle>
            <div className="mt-2">
              <Row k="Meta campaign ID" v="120210…4471" />
              <Row k="Placements" v="FB Feed, IG Feed, Stories" />
              <Row k="Audience" v="25–45 · fitness interests" />
              <Row k="Started" v="1 Oct 2026" />
              <Row k="Review status" v="Approved by Meta" />
            </div>
          </Card>
        </div>
      </div>
    </OwnerShell>
  );
}
