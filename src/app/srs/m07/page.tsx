import { Badge, Button, Card, Chip, Field, Input, Notice, OwnerShell, PageHeader, Row, Select, SectionTitle } from "@/components/srs/kit";

const steps = ["Business", "Objective", "Audience", "Creative", "Budget", "Review", "Launch"];
const objectives = ["Awareness", "Traffic", "Engagement", "Leads", "App promotion", "Sales"];

export default function M07() {
  return (
    <OwnerShell active="Campaigns">
      <PageHeader title="Create campaign" subtitle="Review every setting before anything is sent to Meta." />
      <div className="mb-5 flex flex-wrap items-center gap-2 text-xs">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span
              className={`grid h-7 w-7 place-items-center rounded-full font-semibold ${
                i < 5 ? "bg-emerald-100 text-emerald-800" : i === 5 ? "bg-teal-700 text-white" : "border border-[var(--line)] bg-white text-slate-500"
              }`}
            >
              {i < 5 ? "✓" : i + 1}
            </span>
            <span className={i === 5 ? "font-semibold text-teal-950" : "text-slate-600"}>{s}</span>
            {i < steps.length - 1 && <span className="h-px w-6 bg-[var(--line)]" />}
          </div>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between">
              <SectionTitle>Meta account connection</SectionTitle>
              <Badge tone="active" dot>
                Connected
              </Badge>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Facebook Page">
                <Select defaultValue="p">
                  <option value="p">Pulse Fit Studio (Page)</option>
                </Select>
              </Field>
              <Field label="Ad account">
                <Select defaultValue="a">
                  <option value="a">Pulse Fit Ads · act_3021 · AUD</option>
                </Select>
              </Field>
            </div>
            <p className="mt-2 text-xs text-slate-500">Only Pages and ad accounts returned by Meta for your login are listed. Instagram account: @pulsefit.studio</p>
          </Card>
          <Card>
            <SectionTitle>Objective and category</SectionTitle>
            <div className="mt-3 flex flex-wrap gap-2">
              {objectives.map((o) => (
                <Chip key={o} selected={o === "Leads"}>
                  {o}
                </Chip>
              ))}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Special ad category">
                <Select defaultValue="n">
                  <option value="n">None (not housing, employment or credit)</option>
                </Select>
              </Field>
              <Field label="Lead form">
                <Select defaultValue="f">
                  <option value="f">Free trial sign-up form (Meta)</option>
                </Select>
              </Field>
            </div>
          </Card>
          <Card>
            <SectionTitle>Budget, schedule and location</SectionTitle>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Field label="Budget type">
                <div className="flex gap-2">
                  <Chip selected>Daily</Chip>
                  <Chip>Lifetime</Chip>
                </div>
              </Field>
              <Field label="Daily budget (AUD)">
                <Input defaultValue="25.00" />
              </Field>
              <Field label="Schedule">
                <Input defaultValue="1 Nov 2026 – no end date" />
              </Field>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_140px]">
              <Field label="Location">
                <Input defaultValue="Crown St, Surry Hills NSW" />
              </Field>
              <Field label="Radius">
                <Select defaultValue="5">
                  <option value="5">5 km</option>
                </Select>
              </Field>
            </div>
            <div className="mt-3">
              <Notice tone="success">Resolved: Crown St, Surry Hills NSW 2010, Australia (−33.884, 151.212). Confirm this is the location you meant.</Notice>
            </div>
          </Card>
          <Card>
            <SectionTitle>Review summary</SectionTitle>
            <div className="mt-2">
              <Row k="Campaign name" v="Spring Trial Pass" />
              <Row k="Objective" v="Leads · Meta lead form" />
              <Row k="Audience" v="Ages 25–45 · fitness interests · 5 km radius" />
              <Row k="Creative" v="Variation 01 + studio-tour · 9:16 reel" />
              <Row k="Spend" v="A$25.00 per day, charged by Meta to the ad account" />
            </div>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <SectionTitle>Ad preview</SectionTitle>
              <div className="flex gap-1">
                <Chip selected>FB Feed</Chip>
                <Chip>IG Feed</Chip>
                <Chip>Stories</Chip>
              </div>
            </div>
            <div className="rounded-lg border border-[var(--line)] bg-white">
              <div className="flex items-center gap-2 p-3 text-xs">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-teal-700 font-bold text-white">PF</span>
                <div>
                  <div className="font-semibold text-slate-800">Pulse Fit Studio</div>
                  <div className="text-slate-500">Sponsored</div>
                </div>
              </div>
              <div className="px-3 pb-2 text-xs text-slate-700">Try Pulse Fit Studio free for 7 days, including one session with a personal trainer.</div>
              <div className="grid h-40 place-items-center bg-gradient-to-br from-teal-700 to-teal-500 font-display text-lg text-white">Your first week is on us</div>
              <div className="flex items-center justify-between p-3 text-xs">
                <span className="text-slate-500">pulsefit.example</span>
                <span className="rounded bg-slate-100 px-2 py-1 font-semibold">Sign up</span>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <SectionTitle>Bradley Filter</SectionTitle>
              <Badge tone="success">Internal check passed</Badge>
            </div>
            <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
              <li>✓ No personal-attribute claims in copy</li>
              <li>✓ No before/after or guaranteed-result wording</li>
              <li>✓ Targeting allowed for category None</li>
              <li>✓ Creative text within placement limits</li>
            </ul>
            <div className="mt-3">
              <Notice tone="warning">This is an internal check, not Meta approval. Meta reviews the ad after submission and may reject it.</Notice>
            </div>
          </Card>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1">
              Back
            </Button>
            <Button className="flex-1">Confirm and submit to Meta</Button>
          </div>
        </div>
      </div>
    </OwnerShell>
  );
}
