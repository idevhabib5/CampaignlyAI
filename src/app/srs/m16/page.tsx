import { Badge, Button, Card, Field, Input, OwnerShell, PageHeader, Select, SectionTitle } from "@/components/srs/kit";
import { cn } from "@/lib/utils";

const tabs = ["Business profile", "Brand kit", "Integrations", "Account & security", "Notifications"];

export default function M16() {
  return (
    <OwnerShell active="Settings">
      <PageHeader title="Settings" subtitle="Business profile, brand kit, connections and account security." />
      <div className="grid gap-5 xl:grid-cols-[220px_1fr]">
        <Card className="h-fit p-3">
          {tabs.map((t) => (
            <div key={t} className={cn("rounded-lg px-3 py-2.5 text-sm font-medium", t === "Integrations" ? "bg-teal-700 text-white" : "text-slate-600")}>
              {t}
            </div>
          ))}
        </Card>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <div className="flex items-center justify-between">
              <SectionTitle>Meta (Facebook &amp; Instagram)</SectionTitle>
              <Badge tone="active" dot>
                Connected
              </Badge>
            </div>
            <div className="mt-3 space-y-1 text-sm text-slate-600">
              <div>Page: Pulse Fit Studio · Ad account: act_3021 (AUD)</div>
              <div>Permissions: ads_management, leads_retrieval, pages_show_list</div>
              <div className="text-xs text-slate-500">Token valid · last campaign sync 10:40 · last lead sync 10:42</div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" size="sm">
                Reconnect
              </Button>
              <Button variant="ghost" size="sm">
                Disconnect
              </Button>
            </div>
            <p className="mt-2 text-xs text-slate-500">Disconnecting stops future changes from Campaignly. Ads already running in Meta keep running.</p>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <SectionTitle>WhatsApp business number</SectionTitle>
              <Badge tone="warning">Template pending</Badge>
            </div>
            <div className="mt-3 grid gap-3">
              <Field label="Connection type">
                <Select defaultValue="own">
                  <option value="own">Use my existing business number</option>
                </Select>
              </Field>
              <Field label="Business number">
                <Input defaultValue="+61 2 •••• 4410 · verified" />
              </Field>
            </div>
            <div className="mt-3 space-y-1 text-xs text-slate-600">
              <div>✓ Free-form replies within 24 hours of the lead’s last message</div>
              <div>⏳ Follow-up template “trial_reminder” awaiting Meta approval</div>
            </div>
          </Card>
          <Card>
            <SectionTitle>Brand kit</SectionTitle>
            <div className="mt-3 flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-lg bg-teal-700 font-bold text-white">PF</div>
              <div className="flex gap-3">
                {["#0F766E", "#EA580C", "#0C1A1A"].map((c) => (
                  <div key={c} className="text-center text-[0.65rem] text-slate-500">
                    <div className="h-9 w-9 rounded-full border border-[var(--line)]" style={{ background: c }} />
                    {c}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Heading font">
                <Select defaultValue="m">
                  <option value="m">Fraunces Semibold</option>
                </Select>
              </Field>
              <Field label="Brand tone">
                <Select defaultValue="f">
                  <option value="f">Friendly and motivating</option>
                </Select>
              </Field>
            </div>
            <p className="mt-2 text-xs text-slate-500">Changes apply to new drafts only; published campaigns are not changed.</p>
          </Card>
          <Card>
            <SectionTitle>Account &amp; security</SectionTitle>
            <div className="mt-3 grid gap-3">
              <Field label="Email">
                <Input defaultValue="alex@pulsefit.example" />
              </Field>
              <Field label="Current password (required to save changes)">
                <Input type="password" defaultValue="••••••••••••••••" />
              </Field>
            </div>
            <div className="mt-3 text-xs text-slate-600">Google sign-in linked · sessions end after 12 hours idle or 7 days.</div>
            <div className="mt-4 flex gap-2">
              <Button size="sm">Save changes</Button>
              <Button size="sm" variant="secondary">
                Sign out of all devices
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </OwnerShell>
  );
}
