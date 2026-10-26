import { Badge, Button, Card, OwnerShell, PageHeader } from "@/components/srs/kit";
import { cn } from "@/lib/utils";

const groups = [
  {
    day: "Today",
    items: [
      ["Lead ready to convert", "Taylor Brooks reached score 82 on Spring Trial Pass. Open the conversation to follow up.", "Ready lead", "hot", false, "18:40"],
      ["Campaign approved and active", "Meta approved “Spring Trial Pass”. It is now delivering.", "Campaign", "active", false, "10:12"],
      ["Lead sync failed, previous data kept", "Meta did not respond. Leads from 10:42 are still shown; retrying automatically.", "Sync", "paused", true, "09:30"],
    ],
  },
  {
    day: "Yesterday",
    items: [
      ["Trial ends in 5 days", "Your Growth plan (A$99 a month) starts on 30 Oct unless you change it.", "Billing", "warning", true, "09:00"],
      ["Campaign rejected by Meta", "“Summer Bootcamp” was rejected: text implies a health outcome. Edit and resubmit.", "Campaign", "danger", true, "16:22"],
    ],
  },
] as const;

export default function M14() {
  return (
    <OwnerShell active="">
      <PageHeader title="Notifications" subtitle="Campaign, lead, sync and billing alerts for Pulse Fit Studio." actions={<Button variant="secondary">Mark all read</Button>} />
      <div className="space-y-6">
        {groups.map((g) => (
          <div key={g.day}>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{g.day}</div>
            <Card className="divide-y divide-[var(--line)] p-0">
              {g.items.map(([t, d, k, tone, read, time]) => (
                <div key={t} className={cn("flex items-start gap-4 px-5 py-4", !read && "bg-teal-50/60")}>
                  <span className={cn("mt-2 h-2 w-2 shrink-0 rounded-full", read ? "bg-transparent" : "bg-orange-500")} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{t}</span>
                      <Badge tone={tone}>{k}</Badge>
                    </div>
                    <div className="mt-0.5 text-sm text-slate-600">{d}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-xs text-slate-500">{time}</span>
                    <span className="text-xs font-semibold text-teal-700">{read ? "Mark unread" : "Mark read"}</span>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        ))}
      </div>
    </OwnerShell>
  );
}
