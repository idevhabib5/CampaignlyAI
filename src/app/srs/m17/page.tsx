import { AdminShell, Badge, Button, Card, PageHeader, SectionTitle, Stat, Table } from "@/components/srs/kit";

export default function M17() {
  return (
    <AdminShell tab="Overview">
      <PageHeader title="Admin operations" subtitle="Aggregated across all businesses. Lead personal data and conversations are not shown to administrators." />
      <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <Stat label="Businesses" value="128" />
        <Stat label="Active trials" value="31" />
        <Stat label="Paid plans" value="74" />
        <Stat label="Active campaigns" value="212" />
        <Stat label="AI generations" value="9,640" hint="Last 30 days" />
        <Stat label="Failed jobs" value="4" hint="Last 24 h · 2 need action" />
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <div>
          <SectionTitle className="mb-2">Users</SectionTitle>
          <Table
            head={["Business", "Plan", "Billing", "Access", ""]}
            rows={[
              ["Pulse Fit Studio", "Trial", <Badge key="1" tone="warning">Trialing</Badge>, <Badge key="2" tone="active">Active</Badge>, <Button key="3" size="sm" variant="secondary">Suspend</Button>],
              ["Glow Beauty Bar", "Growth", <Badge key="1" tone="active">Paid</Badge>, <Badge key="2" tone="active">Active</Badge>, <Button key="3" size="sm" variant="secondary">Suspend</Button>],
              ["Harbour Realty", "Pro", <Badge key="1" tone="danger">Past due</Badge>, <Badge key="2" tone="paused">Read-only</Badge>, <Button key="3" size="sm" variant="secondary">Suspend</Button>],
              ["Spice Route Kitchen", "Starter", <Badge key="1" tone="completed">Cancelled</Badge>, <Badge key="2" tone="draft">Suspended</Badge>, <Button key="3" size="sm">Reactivate</Button>],
            ]}
          />
        </div>
        <div>
          <SectionTitle className="mb-2">Job queue</SectionTitle>
          <Table
            head={["Job", "Business", "Status", "Error", ""]}
            rows={[
              ["Lead sync", "Harbour Realty", <Badge key="1" tone="danger">Failed</Badge>, "Meta token expired", <Button key="3" size="sm" variant="secondary" disabled>Retry</Button>],
              ["WhatsApp follow-up", "Glow Beauty Bar", <Badge key="1" tone="danger">Failed</Badge>, "Provider timeout (3/3)", <Button key="3" size="sm">Retry</Button>],
              ["Campaign sync", "Pulse Fit Studio", <Badge key="1" tone="active">Completed</Badge>, "—", ""],
              ["Ad generation", "Spice Route Kitchen", <Badge key="1" tone="reviewing">Running</Badge>, "—", ""],
            ]}
          />
          <p className="mt-2 text-xs text-slate-500">Retry rechecks the current subscription and never repeats a completed send.</p>
        </div>
        <Card>
          <SectionTitle className="mb-3">AI usage · 30 days</SectionTitle>
          {(
            [
              ["Ad copy", 7120, 92],
              ["Images", 1830, 60],
              ["Videos", 214, 18],
              ["WhatsApp replies", 476, 30],
            ] as const
          ).map(([l, v, w]) => (
            <div key={l} className="mb-3">
              <div className="mb-1 flex justify-between text-xs text-slate-600">
                <span>{l}</span>
                <span className="font-semibold text-slate-800">{v.toLocaleString()}</span>
              </div>
              <div className="h-2 rounded-full bg-teal-100">
                <div className="h-2 rounded-full bg-teal-700" style={{ width: `${w}%` }} />
              </div>
            </div>
          ))}
          <div className="text-xs text-slate-500">Generation failures 1.8% · top cause: provider timeout</div>
        </Card>
        <Card>
          <SectionTitle className="mb-3">Meta API health</SectionTitle>
          {(
            [
              ["Valid connections", "109", "active"],
              ["Reconnect required", "6", "paused"],
              ["Sync failures (24 h)", "3", "danger"],
              ["Rate-limit warnings", "0", "draft"],
            ] as const
          ).map(([l, v, t]) => (
            <div key={l} className="flex items-center justify-between border-b border-[var(--line)] py-2 text-sm last:border-0">
              <span className="text-slate-700">{l}</span>
              <Badge tone={t}>{v}</Badge>
            </div>
          ))}
          <div className="mt-2 text-xs text-slate-500">Access tokens are never displayed.</div>
        </Card>
      </div>
    </AdminShell>
  );
}
