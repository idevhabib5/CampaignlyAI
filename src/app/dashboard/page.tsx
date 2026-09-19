import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { PageHeader, StatCard, StatusBadge } from "@/components/ui";
import { CheckCircle2, Circle } from "lucide-react";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [campaigns, leads, creatives, notifications, readyCount, activeCampaigns] =
    await Promise.all([
      prisma.campaign.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.lead.findMany({ where: { userId: user.id } }),
      prisma.adCreative.count({ where: { userId: user.id } }),
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.whatsAppConversation.count({
        where: { userId: user.id, readyForConversion: true },
      }),
      prisma.campaign.count({ where: { userId: user.id, status: "ACTIVE" } }),
    ]);

  const allCampaigns = await prisma.campaign.findMany({ where: { userId: user.id } });
  const fullTotals = allCampaigns.reduce(
    (acc, c) => {
      acc.impressions += c.impressions;
      acc.clicks += c.clicks;
      acc.conversions += c.conversions;
      acc.spend += c.spend;
      return acc;
    },
    { impressions: 0, clicks: 0, conversions: 0, spend: 0 }
  );

  const steps = [
    {
      id: "ads",
      label: "Generate an AI ad",
      done: creatives > 0,
      href: "/dashboard/ads",
      cta: "Generate ad",
    },
    {
      id: "campaign",
      label: "Deploy a Meta campaign",
      done: allCampaigns.length > 0,
      href: "/dashboard/campaigns",
      cta: "Deploy campaign",
    },
    {
      id: "leads",
      label: "Sync or review leads",
      done: leads.length > 0,
      href: "/dashboard/leads",
      cta: "Open leads",
    },
    {
      id: "whatsapp",
      label: "Nurture a lead on WhatsApp",
      done: readyCount > 0 || notifications.some((n) => n.type === "conversion_ready"),
      href: "/dashboard/whatsapp",
      cta: "Open WhatsApp",
    },
  ];

  const nextStep = steps.find((s) => !s.done) || steps[steps.length - 1];
  const plan = user.subscription?.plan || "TRIAL";

  return (
    <div>
      <PageHeader
        title="Overview"
        description="Follow the checklist to complete the MVP journey from ad to conversion-ready lead."
        actions={
          <>
            <span className="badge bg-teal-100 text-teal-800 self-center">{plan} plan</span>
            <Link href={nextStep.href} className="btn-primary">
              {nextStep.cta}
            </Link>
          </>
        }
      />

      <div className="card mb-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-teal-950">MVP next steps</h2>
          <p className="text-xs text-slate-500">
            {steps.filter((s) => s.done).length}/{steps.length} complete
          </p>
        </div>
        <ol className="mt-4 space-y-3">
          {steps.map((step, i) => (
            <li key={step.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {step.done ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-slate-300" />
                )}
                <div className="min-w-0">
                  <div className={`text-sm font-medium ${step.done ? "text-slate-500 line-through" : "text-slate-900"}`}>
                    {i + 1}. {step.label}
                  </div>
                </div>
              </div>
              {!step.done && (
                <Link href={step.href} className="btn-secondary shrink-0 px-3 py-1.5 text-xs">
                  {step.cta}
                </Link>
              )}
              {step.done && (
                <Link href={step.href} className="text-xs font-medium text-teal-700 hover:underline">
                  View
                </Link>
              )}
            </li>
          ))}
        </ol>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Impressions" value={formatNumber(fullTotals.impressions)} />
        <StatCard label="Clicks" value={formatNumber(fullTotals.clicks)} />
        <StatCard
          label="Leads"
          value={leads.length}
          hint={`${readyCount} conversion-ready · ${activeCampaigns} active campaigns`}
        />
        <StatCard label="Spend" value={formatCurrency(fullTotals.spend)} hint={`${creatives} ads`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="border-b border-[var(--line)] px-5 py-4 font-semibold text-teal-950">
            Recent campaigns
          </div>
          <div className="divide-y divide-[var(--line)]">
            {campaigns.length === 0 && (
              <div className="px-5 py-8 text-sm text-slate-500">
                No campaigns yet.{" "}
                <Link href="/dashboard/ads" className="font-semibold text-teal-700">
                  Generate an ad
                </Link>{" "}
                then deploy it.
              </div>
            )}
            {campaigns.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div>
                  <div className="font-medium text-slate-900">{c.name}</div>
                  <div className="text-xs text-slate-500">
                    {formatNumber(c.impressions)} impr · {formatNumber(c.clicks)} clicks ·{" "}
                    {formatCurrency(c.spend)}
                  </div>
                </div>
                <StatusBadge status={c.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="border-b border-[var(--line)] px-5 py-4 font-semibold text-teal-950">
            Alerts
          </div>
          <div className="divide-y divide-[var(--line)]">
            {notifications.length === 0 && (
              <div className="px-5 py-8 text-sm text-slate-500">You&apos;re all caught up.</div>
            )}
            {notifications.map((n) => (
              <div key={n.id} className="px-5 py-3">
                <div className="text-sm font-medium text-slate-900">{n.title}</div>
                <div className="text-xs text-slate-500">{n.message}</div>
              </div>
            ))}
          </div>
          {readyCount > 0 && (
            <div className="border-t border-[var(--line)] p-4">
              <Link href="/dashboard/whatsapp" className="btn-primary w-full">
                Review {readyCount} hot WhatsApp lead{readyCount > 1 ? "s" : ""}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
