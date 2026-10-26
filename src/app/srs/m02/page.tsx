import { Badge, Button, Card, Chip, Field, Input, Notice, Progress, Select, Textarea, Wordmark } from "@/components/srs/kit";
import { cn } from "@/lib/utils";

const steps = [
  ["Business basics", "Pulse Fit Studio"],
  ["Industry", "Fitness · Gym & personal training"],
  ["Offer and audience", ""],
  ["Brand tone", ""],
  ["Location", ""],
  ["Review", ""],
];

export default function M02() {
  return (
    <div className="min-h-screen bg-hero-mesh">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <Wordmark size={32} />
        <h1 className="mt-6 font-display text-4xl font-semibold text-teal-950">Set up your business</h1>
        <p className="mt-1 text-sm text-slate-600">Step 3 of 6 · your progress is saved after every step, so you can resume later.</p>
        <div className="mt-4 max-w-xl">
          <Progress value={50} />
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[240px_1fr_260px]">
          <Card className="h-fit p-3">
            {steps.map(([s, v], i) => (
              <div key={s} className={cn("rounded-lg px-3 py-2.5", i === 2 && "bg-teal-700 text-white")}>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span
                    className={cn(
                      "grid h-6 w-6 place-items-center rounded-full text-xs",
                      i < 2 ? "bg-emerald-100 text-emerald-800" : i === 2 ? "bg-white text-teal-800" : "border border-[var(--line)] text-slate-500",
                    )}
                  >
                    {i < 2 ? "✓" : i + 1}
                  </span>
                  <span className={i > 2 ? "text-slate-500" : ""}>{s}</span>
                </div>
                {v && <div className="ml-8 mt-0.5 text-xs text-slate-500">{v}</div>}
              </div>
            ))}
          </Card>
          <Card className="p-6">
            <div className="font-display text-xl font-semibold text-teal-950">Offer and audience</div>
            <div className="mt-4 space-y-4">
              <Field label="What are you promoting? *">
                <Input defaultValue="Free 7-day trial pass with one personal training session" />
              </Field>
              <Field label="Main services">
                <Textarea defaultValue="Group classes, personal training, nutrition coaching" className="!min-h-16" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Target age range *">
                  <Select defaultValue="a">
                    <option value="a">25–45</option>
                  </Select>
                </Field>
                <Field label="Gender">
                  <Select defaultValue="all">
                    <option value="all">All</option>
                  </Select>
                </Field>
              </div>
              <Field label="Audience interests">
                <div className="flex flex-wrap gap-2">
                  <Chip selected>Fitness</Chip>
                  <Chip selected>Weight loss</Chip>
                  <Chip>Yoga</Chip>
                  <Chip selected>Healthy eating</Chip>
                  <Chip>Running</Chip>
                </div>
              </Field>
              <Field label="Main customer goal *">
                <Input defaultValue="" placeholder="e.g. lose weight, build strength" className="!border-red-600" />
              </Field>
              <p className="-mt-3 text-xs font-medium text-red-700">Add the main goal of your customers to continue.</p>
            </div>
            <div className="mt-6 flex justify-between">
              <Button variant="secondary">Back</Button>
              <Button>Continue</Button>
            </div>
          </Card>
          <div className="space-y-4">
            <Card ai>
              <Badge tone="ai">AI tip</Badge>
              <p className="mt-2 text-sm text-slate-700">
                Fitness offers with a clear free trial and a single next step usually work best with a Leads objective. You can change this later.
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="sm">Use suggestion</Button>
                <Button size="sm" variant="ghost">
                  Dismiss
                </Button>
              </div>
            </Card>
            <Notice tone="info">Your profile personalises every ad, template and WhatsApp reply. Required fields are marked *.</Notice>
          </div>
        </div>
      </div>
    </div>
  );
}
