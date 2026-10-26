import Link from "next/link";
import { Badge, Button, Card, OwnerShell, PageHeader, Table } from "@/components/srs/kit";

const rows = [
  ["Spring Trial Pass", "Leads", "Active", "active", "A$25 / day", "A$318", "52", "A$6.12", "2.4%", "Pause"],
  ["Instagram Stories — Trial Offer", "Leads", "Paused", "paused", "A$15 / day", "A$142", "19", "A$7.47", "1.9%", "Resume"],
  ["Weekday Morning Classes", "Traffic", "In review", "reviewing", "A$400 lifetime", "A$0", "—", "—", "—", ""],
  ["Summer Bootcamp", "Leads", "Rejected by Meta", "danger", "A$20 / day", "A$58", "10", "A$5.80", "2.1%", ""],
] as const;

export default function M08() {
  return (
    <OwnerShell active="Campaigns">
      <PageHeader
        title="Campaigns"
        subtitle="Meta status, spend and results for every campaign. Metrics last synced from Meta today at 10:40."
        actions={<Button>Create campaign</Button>}
      />
      <Card className="mb-4 flex items-center justify-between p-4">
        <div className="text-sm">
          <span className="font-semibold text-slate-800">Meta connection</span>
          <span className="ml-2 text-slate-500">Pulse Fit Ads · act_3021 · AUD</span>
        </div>
        <Badge tone="active" dot>
          Connected
        </Badge>
      </Card>
      <Table
        head={["Campaign", "Status", "Budget", "Spend", "Leads", "Cost / lead", "CTR", "Actions"]}
        rows={rows.map(([n, o, s, t, b, sp, l, c, ctr, a]) => [
          <div key="n">
            <Link href="/srs/m09" className="font-semibold text-teal-900 hover:underline">
              {n}
            </Link>
            <div className="text-xs text-slate-500">Objective: {o}</div>
          </div>,
          <div key="s">
            <Badge tone={t}>{s}</Badge>
            {t === "danger" && <div className="mt-1 text-xs text-red-700">Reason: text implies a health outcome</div>}
          </div>,
          b,
          sp,
          l,
          c,
          ctr,
          <div key="a" className="flex gap-1.5">
            {a && (
              <Button size="sm" variant="secondary">
                {a}
              </Button>
            )}
            <Button size="sm" variant="secondary">
              Analytics
            </Button>
            <Button size="sm" variant="secondary">
              Duplicate
            </Button>
            {t !== "danger" && (
              <Button size="sm" variant="ghost">
                Stop
              </Button>
            )}
          </div>,
        ])}
      />
      <p className="mt-3 text-xs text-slate-500">
        Pause, resume and stop are sent to Meta and shown as pending until Meta confirms. Duplicate creates an editable draft and never publishes.
      </p>
    </OwnerShell>
  );
}
