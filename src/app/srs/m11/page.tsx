import { Badge, Button, Card, OwnerShell, Row, SectionTitle, Select } from "@/components/srs/kit";

const timeline = [
  ["Marked Converted by Alex Rivera", "Owner action", "Today 09:15"],
  ["Booked a free trial class for Saturday 10 am", "WhatsApp · AI agent", "Yesterday 18:42"],
  ["Intent score rose to 95 · reached Ready (owner notified)", "Scoring", "Yesterday 18:40"],
  ["Asked about monthly membership price", "WhatsApp · lead", "Yesterday 18:37"],
  ["First reply sent within 1 minute", "WhatsApp · AI agent", "22 Oct 14:06"],
  ["Lead form submitted: Spring Trial Pass", "Meta lead form", "22 Oct 14:05"],
];

export default function M11() {
  return (
    <OwnerShell active="Leads">
      <div className="mb-1 text-xs font-semibold text-teal-700">← Back to leads</div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-teal-700 font-bold text-white">SP</div>
          <div>
            <h1 className="font-display text-3xl font-semibold text-teal-950">Sam Patel</h1>
            <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
              <Badge tone="active">Converted</Badge> Score 95/100 · Spring Trial Pass
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">Open in WhatsApp</Button>
          <Button>Take over conversation</Button>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        <div className="space-y-4">
          <Card>
            <SectionTitle>Lead form fields</SectionTitle>
            <div className="mt-2">
              <Row k="Full name" v="Sam Patel" />
              <Row k="Phone" v="+61 402 ••• 990" />
              <Row k="Email" v="sam.p@example.com" />
              <Row k="Preferred time" v="Evenings" />
              <Row k="Fitness goal" v="Build strength" />
              <Row k="Source" v="Meta lead form · 22 Oct 14:05" />
            </div>
          </Card>
          <Card>
            <SectionTitle>Status</SectionTitle>
            <div className="mt-3">
              <Select defaultValue="c">
                <option value="c">Converted</option>
              </Select>
            </div>
            <p className="mt-2 text-xs text-slate-500">Status options: New, Contacted, Ready, Converted, Do not contact. Changes are recorded in the timeline.</p>
          </Card>
        </div>
        <Card>
          <SectionTitle>Activity timeline</SectionTitle>
          <div className="mt-4 space-y-0">
            {timeline.map(([t, s, d], i) => (
              <div key={t} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span className="mt-1 h-3 w-3 rounded-full border-2 border-teal-700 bg-white" />
                  {i < timeline.length - 1 && <span className="w-px flex-1 bg-[var(--line)]" />}
                </div>
                <div className="pb-5">
                  <div className="text-sm font-medium text-slate-800">{t}</div>
                  <div className="text-xs text-slate-500">
                    {s} · {d}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </OwnerShell>
  );
}
