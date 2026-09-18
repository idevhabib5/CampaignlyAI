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

  const [users, campaigns, leads, creatives, recentUsers, enquiries, metaHealth, jobs] =
    await Promise.all([
      prisma.user.count(),
      prisma.campaign.count(),
      prisma.lead.count(),
      prisma.adCreative.count(),
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
      checkMetaApiHealth(),
      processScheduledFollowUps(),
    ]);

  return (
    <DashboardShell
      user={{ name: user.name, email: user.email, role: user.role, businessName: "Platform Admin" }}
    >
      <PageHeader
        title="Admin operations"
        description="User management, platform metrics, Meta health, and background job status."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Users" value={users} />
        <StatCard label="Campaigns" value={campaigns} />
        <StatCard label="Leads" value={leads} />
        <StatCard label="AI creatives" value={creatives} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card p-5">
          <h2 className="font-semibold text-teal-950">Meta API health</h2>
          <p className="mt-2 text-sm text-slate-600">
            Status: <span className="font-semibold text-emerald-700">{metaHealth.status}</span>
          </p>
          <p className="text-sm text-slate-600">Latency: {metaHealth.latencyMs}ms</p>
          <p className="mt-2 text-xs text-slate-500">Mocked health check for POC.</p>
        </div>
        <div className="card p-5">
          <h2 className="font-semibold text-teal-950">Background jobs</h2>
          <p className="mt-2 text-sm text-slate-600">{jobs.note}</p>
          <p className="text-xs text-slate-500">Processed this tick: {jobs.processed}</p>
        </div>
        <div className="card p-5">
          <h2 className="font-semibold text-teal-950">AI usage</h2>
          <p className="mt-2 text-sm text-slate-600">{creatives} ad generations stored</p>
          <p className="text-xs text-slate-500">OpenAI/Pinecone mocked via local intelligence layer.</p>
        </div>
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
                      <div className="text-xs text-slate-500">
                        {u.business.industry} ·{" "}
                        {u.business.onboardingComplete ? "onboarded" : "incomplete"}
                      </div>
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

      <div className="card mt-6">
        <div className="border-b border-[var(--line)] px-5 py-4 font-semibold text-teal-950">
          Marketing enquiries
        </div>
        <div className="divide-y divide-[var(--line)]">
          {enquiries.length === 0 && (
            <div className="px-5 py-6 text-sm text-slate-500">No enquiries yet.</div>
          )}
          {enquiries.map((e) => (
            <div key={e.id} className="px-5 py-3 text-sm">
              <div className="font-medium">
                {e.name} · {e.email}
              </div>
              <div className="text-slate-600">{e.message}</div>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
