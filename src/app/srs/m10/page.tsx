import Link from "next/link";
import { Badge, Button, Card, Input, OwnerShell, PageHeader, Select, Stat, Table } from "@/components/srs/kit";

const leads = [
  ["Taylor Brooks", "+61 412 ••• 567", "Spring Trial Pass", 92, "Ready", "2 min ago"],
  ["Jordan Lee", "+61 433 ••• 212", "Spring Trial Pass", 85, "Ready", "3 hr ago"],
  ["Casey Morgan", "+61 421 ••• 543", "Instagram Stories — Trial Offer", 64, "Contacted", "1 hr ago"],
  ["Riley Chen", "—", "Summer Bootcamp", null, "New", "5 hr ago"],
  ["Sam Patel", "+61 402 ••• 990", "Spring Trial Pass", 95, "Converted", "2 days ago"],
  ["Morgan Ellis", "+61 445 ••• 118", "Summer Bootcamp", 22, "Do not contact", "4 days ago"],
] as const;

const tone = { Ready: "hot", Contacted: "reviewing", New: "draft", Converted: "active", "Do not contact": "danger" } as const;

export default function M10() {
  return (
    <OwnerShell active="Leads">
      <PageHeader
        title="Leads"
        subtitle="Leads synced from your Meta lead forms. Only your business can see these records."
        actions={
          <>
            <span className="text-xs text-slate-500">Last successful sync: today 10:42</span>
            <Button>↻ Refresh from Meta</Button>
          </>
        }
      />
      <div className="mb-5 grid gap-4 sm:grid-cols-5">
        <Stat label="Total leads" value="81" />
        <Stat label="New" value="23" />
        <Stat label="Ready (70+)" value="12" />
        <Stat label="Converted" value="16" hint="Conversion rate 19.8%" />
        <Stat label="Do not contact" value="3" />
      </div>
      <Card className="mb-4 p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_240px_200px_160px]">
          <Input placeholder="Search by name or phone…" />
          <Select defaultValue="all">
            <option value="all">All campaigns</option>
          </Select>
          <Select defaultValue="all">
            <option value="all">All statuses</option>
          </Select>
          <Select defaultValue="score">
            <option value="score">Sort: score</option>
          </Select>
        </div>
      </Card>
      <Table
        head={["Lead", "Phone", "Campaign", "Score", "Status", "Last activity", ""]}
        rows={leads.map(([n, p, c, s, st, a]) => [
          <span key="n" className="font-semibold text-slate-800">
            {n}
          </span>,
          <span key="p" className="text-slate-600">
            {p}
          </span>,
          c,
          s === null ? <span className="text-slate-400">Unscored</span> : `${s}/100`,
          <Badge key="b" tone={tone[st]}>
            {st}
          </Badge>,
          <span key="a" className="text-slate-500">
            {a}
          </span>,
          <Link key="o" href="/srs/m11" className="btn-secondary !px-3 !py-1.5 !text-xs">
            Open
          </Link>,
        ])}
      />
      <p className="mt-3 text-xs text-slate-500">Fields not supplied by Meta are shown as “—”. Marking a lead Do not contact stops all automated WhatsApp messages.</p>
    </OwnerShell>
  );
}
