import { Badge, Button, Card, Chip, Field, Input, OwnerShell, PageHeader, Select, SectionTitle, Textarea } from "@/components/srs/kit";
import { cn } from "@/lib/utils";

const variations = [
  {
    n: "01",
    head: "Your first week is on us",
    body: "Try Pulse Fit Studio free for 7 days, including one session with a personal trainer. Classes from 6 am in Surry Hills.",
    read: 82,
    comp: 96,
    sel: true,
  },
  {
    n: "02",
    head: "Find a class that fits your day",
    body: "Early, lunchtime or evening group classes with friendly coaches. Claim your free trial pass today.",
    read: 78,
    comp: 94,
  },
  {
    n: "03",
    head: "Train with a coach who knows you",
    body: "Personal training and small group classes near Central Station. Book your free first session in two minutes.",
    read: 75,
    comp: 91,
  },
];

export default function M04() {
  return (
    <OwnerShell active="Ads">
      <PageHeader
        title="AI Ad Generator"
        subtitle="Drafts use your saved business profile and the published policy dataset. Nothing is published automatically."
        actions={<Badge tone="ai">Copy credits 14 / 20</Badge>}
      />
      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <Card className="h-fit">
          <SectionTitle>Ad brief</SectionTitle>
          <div className="mt-4 space-y-4">
            <Field label="Campaign goal">
              <Select defaultValue="l">
                <option value="l">Leads · collect trial sign-ups</option>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Age min">
                <Input defaultValue="25" />
              </Field>
              <Field label="Age max">
                <Input defaultValue="45" />
              </Field>
            </div>
            <Field label="Location">
              <Input defaultValue="Surry Hills NSW · 5 km" />
            </Field>
            <Field label="Tone">
              <div className="flex flex-wrap gap-2">
                <Chip selected>Friendly</Chip>
                <Chip>Energetic</Chip>
                <Chip>Professional</Chip>
              </div>
            </Field>
            <Field label="Offer">
              <Input defaultValue="Free 7-day trial pass + 1 PT session" />
            </Field>
            <Field label="Key message">
              <Textarea defaultValue="Classes at times that suit busy people" className="!min-h-16" />
            </Field>
            <Field label="Call to action">
              <Select defaultValue="s">
                <option value="s">Sign up</option>
              </Select>
            </Field>
            <Field label="Output">
              <div className="flex flex-wrap gap-2">
                <Chip selected>Copy</Chip>
                <Chip selected>Image</Chip>
                <Chip>Video</Chip>
              </div>
            </Field>
            <Button className="w-full">Generate ad variations</Button>
          </div>
        </Card>
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            {variations.map((v) => (
              <Card key={v.n} className={cn("p-4", v.sel && "border-2 border-teal-700")}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-500">Variation {v.n}</span>
                  {v.sel && <Badge tone="ai">Selected</Badge>}
                </div>
                <div className="mt-3 grid h-32 place-items-center rounded-lg bg-gradient-to-br from-teal-700 to-teal-500 px-4 text-center font-display text-lg text-white">
                  {v.head}
                </div>
                <p className="mt-3 text-sm text-slate-700">{v.body}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <Badge tone="success">Readability {v.read}</Badge>
                  <Badge tone="success">Compliance {v.comp}</Badge>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="secondary">
                    Edit
                  </Button>
                  <Button size="sm">Use in campaign</Button>
                </div>
              </Card>
            ))}
          </div>
          <Card>
            <div className="flex items-center justify-between">
              <SectionTitle>Bradley Filter</SectionTitle>
              <Badge tone="success">Internal check passed</Badge>
            </div>
            <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
              <div>✓ No personal-attribute claims (“Are you overweight?”)</div>
              <div>✓ No guaranteed-result or before/after wording</div>
              <div>✓ Headline and text within placement limits</div>
              <div>✓ Image text below 20% of the frame</div>
            </div>
            <p className="mt-3 text-xs text-amber-800">This is an internal check, not Meta approval. Meta reviews every ad after submission.</p>
          </Card>
          <Card>
            <SectionTitle>Saved ads</SectionTitle>
            <div className="mt-3 divide-y divide-[var(--line)]">
              {[
                ["Your first week is on us", "Leads · copy + image · saved today", "Draft"],
                ["Spring Trial Pass", "Leads · used in campaign", "In use"],
              ].map(([t, m, s]) => (
                <div key={t} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <div className="font-medium text-slate-800">{t}</div>
                    <div className="text-xs text-slate-500">{m}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={s === "Draft" ? "draft" : "active"}>{s}</Badge>
                    <Button size="sm" variant="secondary">
                      Open
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </OwnerShell>
  );
}
