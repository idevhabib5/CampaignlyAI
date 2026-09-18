import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, StatusBadge } from "@/components/ui";
import { parseJson } from "@/lib/utils";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  const recs = parseJson<Record<string, unknown>>(user.business?.aiRecommendations, {});

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Business profile, branding, and account details used for AI personalization."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-semibold text-teal-950">Account</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Name</dt>
              <dd className="font-medium">{user.name}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Email</dt>
              <dd className="font-medium">{user.email}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Role</dt>
              <dd>
                <StatusBadge status={user.role} />
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Plan</dt>
              <dd className="font-medium">
                {user.subscription?.plan} ({user.subscription?.status})
              </dd>
            </div>
          </dl>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-teal-950">Business profile</h2>
          {user.business ? (
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-slate-500">Business</dt>
                <dd className="font-medium">{user.business.businessName}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Industry</dt>
                <dd className="font-medium">
                  {user.business.industry}
                  {user.business.category ? ` · ${user.business.category}` : ""}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Brand</dt>
                <dd className="font-medium">
                  {user.business.brandTone} / {user.business.communicationStyle}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Audience</dt>
                <dd>{user.business.targetAudience || "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Location</dt>
                <dd>{user.business.location || "—"}</dd>
              </div>
              {"suggestedBudget" in recs && (
                <div>
                  <dt className="text-slate-500">AI suggested budget</dt>
                  <dd>${String(recs.suggestedBudget)}/day</dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="mt-3 text-sm text-slate-500">No business profile yet.</p>
          )}
          <a href="/onboarding" className="btn-secondary mt-5 inline-flex">
            Edit via onboarding wizard
          </a>
        </div>
      </div>

      <div className="card mt-6">
        <div className="border-b border-[var(--line)] px-5 py-4 font-semibold text-teal-950">
          Recent notifications
        </div>
        <div className="divide-y divide-[var(--line)]">
          {notifications.map((n) => (
            <div key={n.id} className="px-5 py-3">
              <div className="text-sm font-medium">{n.title}</div>
              <div className="text-xs text-slate-500">{n.message}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
