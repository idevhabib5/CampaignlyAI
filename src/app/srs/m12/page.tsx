import { Badge, Button, Card, Input, OwnerShell, PageHeader, Progress, SectionTitle } from "@/components/srs/kit";
import { cn } from "@/lib/utils";

const inbox = [
  ["Taylor Brooks", "How much is the monthly plan?", "AI active", 82, true],
  ["Casey Morgan", "Is parking available?", "AI active", 64, false],
  ["Jordan Lee", "Can I bring a friend?", "Manual", 85, false],
  ["Riley Chen", "Follow-up scheduled · 24 h", "AI active", 41, false],
] as const;

const thread = [
  ["lead", "Hi, I saw your free trial ad. How much is the monthly plan after the trial?", "18:36"],
  ["ai", "Hi Taylor! After your free 7-day pass, memberships start at A$39 a week with unlimited classes. Would you like to book your first class?", "18:36"],
  ["lead", "Yes, Saturday morning would be good.", "18:40"],
  ["ai", "Saturday at 10 am has spaces. Shall I book it for you?", "18:41"],
] as const;

export default function M12() {
  return (
    <OwnerShell active="WhatsApp">
      <PageHeader
        title="WhatsApp AI Agent"
        subtitle="The agent answers and follows up leads from your business number. You can pause it or take over any conversation."
        actions={<Button variant="secondary">Pause AI for all</Button>}
      />
      <div className="mb-5 grid gap-4 sm:grid-cols-4">
        {[
          ["Open conversations", "18"],
          ["Replied in under 1 min", "94%"],
          ["Ready leads", "12"],
          ["Taken over", "3"],
        ].map(([l, v]) => (
          <div key={l} className="card p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{l}</div>
            <div className="mt-2 font-display text-3xl font-semibold text-teal-950">{v}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[300px_1fr_320px]">
        <Card className="p-3">
          <div className="px-2 pb-2 text-sm font-semibold text-slate-700">Inbox</div>
          {inbox.map(([n, m, s, sc, on]) => (
            <div key={n} className={cn("rounded-lg px-3 py-2.5", on && "bg-teal-50 ring-1 ring-teal-200")}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-800">{n}</span>
                <span className="text-xs font-semibold text-slate-500">{sc}</span>
              </div>
              <div className="truncate text-xs text-slate-500">{m}</div>
              <div className="mt-1">
                <Badge tone={s === "Manual" ? "reviewing" : "ai"}>{s}</Badge>
              </div>
            </div>
          ))}
        </Card>
        <Card className="flex flex-col p-0">
          <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-3">
            <div>
              <div className="font-semibold text-slate-800">Taylor Brooks</div>
              <div className="text-xs text-slate-500">+61 412 ••• 567 · Spring Trial Pass · inside the 24-hour window</div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary">
                Continue with AI
              </Button>
              <Button size="sm">Take over</Button>
            </div>
          </div>
          <div className="flex-1 space-y-3 bg-[#f3faf8] px-5 py-4">
            {thread.map(([w, t, time], i) => (
              <div key={i} className={cn("flex", w === "ai" ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[75%] rounded-2xl px-4 py-2.5 text-sm", w === "ai" ? "bg-teal-700 text-white" : "border border-[var(--line)] bg-white text-slate-800")}>
                  {w === "ai" && <div className="mb-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-teal-100">AI agent</div>}
                  {t}
                  <div className={cn("mt-1 text-right text-[0.65rem]", w === "ai" ? "text-teal-100" : "text-slate-400")}>{time}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 border-t border-[var(--line)] p-3">
            <Input placeholder="Type a reply (taking over pauses the AI for this lead)…" />
            <Button>Send</Button>
          </div>
        </Card>
        <div className="space-y-4">
          <Card ai>
            <SectionTitle>Intent score</SectionTitle>
            <div className="mt-2 font-display text-4xl font-semibold text-teal-950">
              82<span className="font-sans text-sm text-slate-500"> / 100</span>
            </div>
            <div className="mt-2">
              <Progress value={82} />
            </div>
            <div className="mt-2">
              <Badge tone="hot">Ready · owner notified</Badge>
            </div>
            <ul className="mt-3 space-y-1 text-xs text-slate-600">
              <li>+ Asked about price</li>
              <li>+ Accepted a class time</li>
              <li>+ Replied within 5 minutes</li>
            </ul>
          </Card>
          <Card>
            <SectionTitle>AI summary</SectionTitle>
            <p className="mt-2 text-sm text-slate-700">Interested in a monthly membership after the trial; prefers Saturday mornings.</p>
            <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              <span className="font-semibold">Suggested reply:</span> “Great, you’re booked for Saturday 10 am. Bring water and a towel!”
            </div>
          </Card>
        </div>
      </div>
    </OwnerShell>
  );
}
