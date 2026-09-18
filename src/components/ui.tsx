"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Sparkles,
  Megaphone,
  Users,
  MessageCircle,
  ImageIcon,
  CreditCard,
  Settings,
  Bell,
  LogOut,
  Link2,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ownerLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/ads", label: "Ad Generator", icon: Sparkles },
  { href: "/dashboard/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/dashboard/leads", label: "Leads", icon: Users },
  { href: "/dashboard/whatsapp", label: "WhatsApp AI", icon: MessageCircle },
  { href: "/dashboard/media", label: "Media", icon: ImageIcon },
  { href: "/dashboard/meta", label: "Meta Connect", icon: Link2 },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const adminLinks = [
  { href: "/admin", label: "Operations", icon: Shield },
  { href: "/dashboard", label: "Owner view", icon: LayoutDashboard },
];

export function DashboardShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name: string; email: string; role: string; businessName?: string | null };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const links = user.role === "ADMIN" && pathname.startsWith("/admin") ? adminLinks : ownerLinks;

  async function logout() {
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[var(--surface)] bg-dash-grid bg-grid">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <aside className="hidden w-64 shrink-0 border-r border-[var(--line)] bg-white/90 p-4 md:flex md:flex-col">
          <Link href="/dashboard" className="font-display text-xl font-semibold text-teal-900">
            Campaignly<span className="text-orange-600">.AI</span>
          </Link>
          <p className="mt-1 truncate text-xs text-slate-500">
            {user.businessName || (user.role === "ADMIN" ? "Platform Admin" : "Business workspace")}
          </p>
          <nav className="mt-8 flex flex-1 flex-col gap-1">
            {user.role === "ADMIN" && (
              <Link
                href="/admin"
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
                  pathname.startsWith("/admin")
                    ? "bg-teal-700 text-white"
                    : "text-slate-600 hover:bg-teal-50"
                )}
              >
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            )}
            {links.map((l) => {
              const Icon = l.icon;
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                    active ? "bg-teal-700 text-white" : "text-slate-600 hover:bg-teal-50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {l.label}
                </Link>
              );
            })}
          </nav>
          <button onClick={logout} className="btn-secondary mt-4 w-full justify-start">
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 items-center justify-between border-b border-[var(--line)] bg-white/80 px-4 backdrop-blur md:px-6">
            <div className="md:hidden">
              <Link href="/dashboard" className="font-display text-lg font-semibold text-teal-900">
                Campaignly.AI
              </Link>
            </div>
            <div className="hidden text-sm text-slate-500 md:block">
              Signed in as <span className="font-medium text-slate-800">{user.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="relative rounded-lg p-2 hover:bg-teal-50 md:hidden">
                <LayoutDashboard className="h-5 w-5 text-teal-800" />
              </Link>
              <Link href="/dashboard/settings" className="relative rounded-lg p-2 hover:bg-teal-50">
                <Bell className="h-5 w-5 text-slate-600" />
              </Link>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-700 text-xs font-bold text-white">
                {user.name.slice(0, 1).toUpperCase()}
              </div>
            </div>
          </header>

          {/* Mobile nav */}
          <div className="flex gap-2 overflow-x-auto border-b border-[var(--line)] bg-white px-3 py-2 md:hidden">
            {ownerLinks.slice(0, 6).map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold",
                  pathname === l.href ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600"
                )}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-teal-950">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-slate-600">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="card p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 font-display text-3xl font-semibold text-teal-950">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
      <h3 className="font-display text-xl font-semibold text-teal-950">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-slate-600">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: "bg-emerald-100 text-emerald-800",
    PAUSED: "bg-amber-100 text-amber-800",
    DRAFT: "bg-slate-100 text-slate-700",
    PENDING_REVIEW: "bg-sky-100 text-sky-800",
    STOPPED: "bg-red-100 text-red-800",
    COMPLETED: "bg-violet-100 text-violet-800",
    NEW: "bg-slate-100 text-slate-700",
    NURTURING: "bg-sky-100 text-sky-800",
    QUALIFIED: "bg-teal-100 text-teal-800",
    CONVERSION_READY: "bg-orange-100 text-orange-800",
    CONVERTED: "bg-emerald-100 text-emerald-800",
    LOST: "bg-red-100 text-red-700",
    TRIALING: "bg-amber-100 text-amber-800",
    AI_ACTIVE: "bg-teal-100 text-teal-800",
    MANUAL: "bg-indigo-100 text-indigo-800",
  };
  return (
    <span className={cn("badge", map[status] || "bg-slate-100 text-slate-700")}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
