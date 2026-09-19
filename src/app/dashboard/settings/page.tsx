import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, StatusBadge } from "@/components/ui";
import { isLiveOnboardingAiConfigured } from "@/lib/services/ai";
import { BusinessProfileForm } from "./business-profile-form";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  const liveAi = isLiveOnboardingAiConfigured();

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Account plan and editable business profile used for AI personalization."
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
                <span className="badge mr-2 bg-teal-100 text-teal-800">
                  {user.subscription?.plan || "TRIAL"}
                </span>
                {user.subscription?.status}
              </dd>
            </div>
          </dl>
        </div>

        <BusinessProfileForm
          aiMode={liveAi ? "live" : "mock_or_unconfigured"}
          initial={
            user.business
              ? {
                  businessName: user.business.businessName,
                  industry: user.business.industry,
                  category: user.business.category,
                  brandTone: user.business.brandTone,
                  communicationStyle: user.business.communicationStyle,
                  targetAudience: user.business.targetAudience,
                  website: user.business.website,
                  location: user.business.location,
                  services: user.business.services,
                  brandColors: user.business.brandColors,
                  logoUrl: user.business.logoUrl,
                  aiRecommendations: user.business.aiRecommendations,
                }
              : null
          }
        />
      </div>

      <div className="card mt-6">
        <div className="border-b border-[var(--line)] px-5 py-4 font-semibold text-teal-950">
          Recent notifications
        </div>
        <div className="divide-y divide-[var(--line)]">
          {notifications.length === 0 ? (
            <div className="px-5 py-4 text-sm text-slate-500">No notifications yet.</div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="px-5 py-3">
                <div className="text-sm font-medium">{n.title}</div>
                <div className="text-xs text-slate-500">{n.message}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
