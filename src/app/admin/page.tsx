export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkMetaApiHealth } from "@/lib/services/meta";
import { processScheduledFollowUps } from "@/lib/services/whatsapp";
import { DashboardShell, PageHeader, StatCard, StatusBadge } from "@/components/ui";
import { AdminUserActions } from "./admin-actions";

export default async function AdminPage() {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) redirect("/login");

  const [
    users,
    campaigns,
    leads,
    creatives,
    mediaCount,
    messages,
    diagnostics,
    recentUsers,
    enquiries,
    referrals,
    highPerformingAds,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.campaign.count(),
    prisma.lead.count(),
    prisma.adCreative.count(),
    prisma.mediaAsset.count(),
    prisma.whatsAppMessage.count(),
    prisma.diagnosticResult.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        subscription: true,
        business: { select: { businessName: true, industry: true, onboardingComplete: true } },
        _count: { select: { campaigns: true, leads: true, creatives: true } },
      },
    }),
    prisma.contactEnquiry.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.referralCampaign.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.adCreative.findMany({
      where: { complianceScore: { gte: 85 } },
      orderBy: { complianceScore: "desc" },
      take: 8,
      select: {
        id: true,
        headline: true,
        complianceScore: true,
        templateId: true,
        status: true,
        user: { select: { email: true } },
      },
    }),
  ]);

  const metaHealth = await checkMetaApiHealth();
  const jobs = await processScheduledFollowUps();

  return (
    <DashboardShell
      user={{ name: user.name, email: user.email, role: user.role, businessName: "Platform Admin" }}
    >
      <PageHeader
        title="Admin operations"
        description="Platform metrics, Meta health, job queue, AI usage, referrals, and high-performing ads."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Users" value={users} />
        <StatCard label="Campaigns" value={campaigns} />
        <StatCard label="Leads" value={leads} />
        <StatCard label="Ads generated" value={creatives} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="card p-5">
          <h2 className="font-semibold text-teal-950">Meta API health</h2>
          <div className="mt-3 flex items-center gap-2">
            <StatusBadge status={metaHealth.status === "healthy" ? "ACTIVE" : "PAUSED"} />
            <span className="text-sm text-slate-600">
              {metaHealth.mock ? "Mock Graph API" : "Live Graph API"}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Latency {metaHealth.latencyMs ?? "—"}ms
            {metaHealth.lastError ? ` · ${metaHealth.lastError}` : ""}
          </p>
        </div>
        <div className="card p-5">
          <h2 className="font-semibold text-teal-950">Job queue (mock BullMQ)</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li className="flex justify-between gap-2">
              <span>WhatsApp follow-ups</span>
              <span className="text-xs text-slate-500">processed {jobs.processed}</span>
            </li>
            <li className="flex justify-between gap-2">
              <span>Meta metrics sync</span>
              <span className="text-xs text-slate-500">idle</span>
            </li>
            <li className="flex justify-between gap-2">
              <span>Lead form ingest</span>
              <span className="text-xs text-slate-500">idle</span>
            </li>
          </ul>
          <p className="mt-3 text-xs text-slate-500">{jobs.note}</p>
        </div>
        <div className="card p-5">
          <h2 className="font-semibold text-teal-950">AI usage (mock)</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Creatives</dt>
              <dd className="font-medium">{creatives}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">WhatsApp messages</dt>
              <dd className="font-medium">{messages}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Media assets</dt>
              <dd className="font-medium">{mediaCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Diagnostics</dt>
              <dd className="font-medium">{diagnostics}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="border-b border-[var(--line)] px-5 py-4 font-semibold text-teal-950">
            Contact enquiries
          </div>
          {enquiries.length === 0 ? (
            <div className="p-5 text-sm text-slate-500">No enquiries yet.</div>
          ) : (
            <ul className="divide-y divide-[var(--line)]">
              {enquiries.map((e) => (
                <li key={e.id} className="px-5 py-3 text-sm">
                  <div className="font-medium">{e.name}</div>
                  <div className="text-xs text-slate-500">
                    {e.email} · {e.company || "—"} · {e.source}
                  </div>
                  <p className="mt-1 text-slate-700">{e.message}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card overflow-hidden">
          <div className="border-b border-[var(--line)] px-5 py-4 font-semibold text-teal-950">
            Referral campaigns
          </div>
          {referrals.length === 0 ? (
            <div className="p-5 text-sm text-slate-500">No referral campaigns seeded.</div>
          ) : (
            <ul className="divide-y divide-[var(--line)]">
              {referrals.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <div>
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-slate-500">
                      {r.code} · {r.channel}
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-600">
                    <div>{r.clicks} clicks</div>
                    <div>{r.signups} signups</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card mt-6 overflow-x-auto">
        <div className="border-b border-[var(--line)] px-5 py-4 font-semibold text-teal-950">
          High-performing ads dataset
        </div>
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Headline</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Template</th>
              <th className="px-4 py-3">Compliance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {highPerformingAds.map((ad) => (
              <tr key={ad.id}>
                <td className="px-4 py-3 font-medium">{ad.headline}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{ad.user.email}</td>
                <td className="px-4 py-3 text-xs">{ad.templateId || "—"}</td>
                <td className="px-4 py-3">
                  <span className="badge bg-emerald-100 text-emerald-800">{ad.complianceScore}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card mt-6 overflow-x-auto">
        <div className="border-b border-[var(--line)] px-5 py-4 font-semibold text-teal-950">Users</div>
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Usage</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {recentUsers.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3">
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs text-slate-500">{u.email}</div>
                </td>
                <td className="px-4 py-3">
                  {u.business ? (
                    <>
                      <div>{u.business.businessName}</div>
                      <div className="text-xs text-slate-500">{u.business.industry}</div>
                    </>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {u.subscription ? (
                    <div className="flex flex-col gap-1">
                      <StatusBadge status={u.subscription.plan} />
                      <StatusBadge status={u.subscription.status} />
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {u._count.campaigns} camps · {u._count.leads} leads · {u._count.creatives} ads
                </td>
                <td className="px-4 py-3">
                  {u.role !== "ADMIN" && u.subscription && <AdminUserActions userId={u.id} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
