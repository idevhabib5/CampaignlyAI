import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { PageHeader, StatCard, StatusBadge } from "@/components/ui";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const [campaigns, leads, creatives, notifications, readyCount] = await Promise.all([
    prisma.campaign.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.lead.findMany({ where: { userId: session.id } }),
    prisma.adCreative.count({ where: { userId: session.id } }),
    prisma.notification.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.whatsAppConversation.count({
      where: { userId: session.id, readyForConversion: true },
    }),
  ]);

  const allCampaigns = await prisma.campaign.findMany({ where: { userId: session.id } });
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

  return (
    <div>
      <PageHeader
        title="Overview"
        description="Campaign performance, leads, and conversion-ready alerts in one place."
        actions={
          <>
            <Link href="/dashboard/ads" className="btn-primary">
              Generate ads
            </Link>
            <Link href="/dashboard/campaigns" className="btn-secondary">
              Manage campaigns
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Impressions" value={formatNumber(fullTotals.impressions)} />
        <StatCard label="Clicks" value={formatNumber(fullTotals.clicks)} />
        <StatCard label="Leads" value={leads.length} hint={`${readyCount} conversion-ready`} />
        <StatCard label="Spend" value={formatCurrency(fullTotals.spend)} hint={`${creatives} creatives`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="border-b border-[var(--line)] px-5 py-4 font-semibold text-teal-950">
            Recent campaigns
          </div>
          <div className="divide-y divide-[var(--line)]">
            {campaigns.length === 0 && (
              <div className="px-5 py-8 text-sm text-slate-500">No campaigns yet. Generate an ad and deploy.</div>
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
            Notifications
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
