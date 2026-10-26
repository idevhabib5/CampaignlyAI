import { AdminShell, Badge, Button, Card, Field, Input, PageHeader, Select, SectionTitle, Table } from "@/components/srs/kit";

export default function M18() {
  return (
    <AdminShell tab="Knowledge base">
      <PageHeader
        title="Knowledge base, referrals and enquiries"
        subtitle="Manage the Meta policy rules and approved examples used for retrieval, referral rewards and website enquiries."
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <SectionTitle>Retrieval dataset versions</SectionTitle>
            <Button size="sm">+ Upload new version</Button>
          </div>
          <Table
            head={["Version", "Content", "Records", "Status", ""]}
            rows={[
              ["v1.4", "Meta ad policy rules · Oct 2026", "312", <Badge key="1" tone="reviewing">In review</Badge>, <Button key="2" size="sm">Publish</Button>],
              ["v1.3", "Policy rules + 140 approved fitness and beauty ads", "468", <Badge key="1" tone="active" dot>Published</Badge>, <Button key="2" size="sm" variant="secondary">Retire</Button>],
              ["v1.2", "Policy rules · Jul 2026", "290", <Badge key="1" tone="completed">Retired</Badge>, ""],
            ]}
          />
          <p className="mt-2 text-xs text-slate-500">Only one published version is searchable. If indexing fails, the previous published version stays active.</p>
          <SectionTitle className="mb-2 mt-6">Referrals</SectionTitle>
          <Table
            head={["Referrer", "Referred business", "Referred reward", "Referrer reward", "Status"]}
            rows={[
              ["Glow Beauty Bar", "Luxe Nails", "+14 trial days", "1 free month", <Badge key="1" tone="active">Awarded</Badge>],
              ["Pulse Fit Studio", "PowerHouse Fitness", "+14 trial days", "Awaiting first paid invoice", <Badge key="1" tone="warning">Pending</Badge>],
              ["Harbour Realty", "Harbour Realty (same owner)", "—", "—", <Badge key="1" tone="danger">Rejected: self-referral</Badge>],
            ]}
          />
        </div>
        <div className="space-y-4">
          <Card>
            <SectionTitle>Upload dataset version</SectionTitle>
            <div className="mt-3 grid gap-3">
              <Field label="Dataset type">
                <Select defaultValue="p">
                  <option value="p">Meta policy rules</option>
                </Select>
              </Field>
              <Field label="File (CSV or JSON)">
                <Input defaultValue="meta-policy-2026-10.json" />
              </Field>
              <Field label="Change note">
                <Input defaultValue="Added health-claim restrictions" />
              </Field>
            </div>
            <Button className="mt-4 w-full">Validate and upload</Button>
          </Card>
          <Card>
            <SectionTitle className="mb-2">Contact enquiries</SectionTitle>
            {[
              ["Priya Shah", "Restaurant · wants a WhatsApp agent demo", "New"],
              ["Maria Lopez", "Real estate · asks about special ad category", "Replied"],
            ].map(([n, m, s]) => (
              <div key={n} className="border-b border-[var(--line)] py-2 text-sm last:border-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">{n}</span>
                  <Badge tone={s === "New" ? "reviewing" : "active"}>{s}</Badge>
                </div>
                <div className="text-xs text-slate-500">{m}</div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
