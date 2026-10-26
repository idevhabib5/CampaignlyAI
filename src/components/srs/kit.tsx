import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  CreditCard,
  ImageIcon,
  LayoutDashboard,
  Link2,
  LogOut,
  Megaphone,
  MessageCircle,
  Settings,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "active" | "paused" | "draft" | "completed" | "reviewing" | "hot" | "ai" | "success" | "warning" | "danger";

const toneClass: Record<Tone, string> = {
  active: "bg-emerald-100 text-emerald-800",
  success: "bg-emerald-100 text-emerald-800",
  paused: "bg-amber-100 text-amber-800",
  warning: "bg-amber-100 text-amber-800",
  draft: "bg-slate-100 text-slate-700",
  completed: "bg-violet-100 text-violet-800",
  reviewing: "bg-sky-100 text-sky-800",
  hot: "bg-orange-100 text-orange-800",
  ai: "bg-teal-100 text-teal-800",
  danger: "bg-red-100 text-red-700",
};

export function Card({
  className,
  ai,
  selected,
  children,
}: {
  className?: string;
  ai?: boolean;
  selected?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "card p-5",
        ai && "border-teal-200 bg-gradient-to-br from-teal-50 via-white to-orange-50/40",
        selected && "ring-2 ring-teal-600",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Badge({ children, tone = "draft", dot }: { children: React.ReactNode; tone?: Tone; dot?: boolean }) {
  return (
    <span className={cn("badge gap-1.5", toneClass[tone])}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  disabled,
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "ai";
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
}) {
  const v = { primary: "btn-primary", ai: "btn-primary", secondary: "btn-secondary", ghost: "btn-ghost", danger: "btn-danger" }[variant];
  const s = { sm: "!px-3 !py-1.5 !text-xs", md: "", lg: "!px-5 !py-3 !text-base" }[size];
  return (
    <button type="button" disabled={disabled} className={cn(v, s, className)}>
      {children}
    </button>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("input", props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn("input min-h-24", props.className)} />;
}

export function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cn("input", props.className)}>
      {children}
    </select>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

export function Chip({ selected, children }: { selected?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-semibold transition",
        selected ? "border-teal-700 bg-teal-700 text-white" : "border-[var(--line)] bg-white text-slate-600 hover:bg-teal-50",
      )}
    >
      {children}
    </button>
  );
}

export function Progress({ value }: { value: number }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-teal-100">
      <div className="h-full rounded-full bg-teal-700" style={{ width: `${value}%` }} />
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-teal-950">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-slate-600">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 font-display text-3xl font-semibold text-teal-950">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}

export function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("font-display text-lg font-semibold text-teal-950", className)}>{children}</div>;
}

export function Table({ head, rows, className }: { head: string[]; rows: React.ReactNode[][]; className?: string }) {
  return (
    <div className={cn("card overflow-hidden", className)}>
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-4 py-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-[var(--line)]">
              {r.map((c, j) => (
                <td key={j} className="px-4 py-3 align-middle">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warning" | "success" | "danger"; children: React.ReactNode }) {
  const tones = {
    info: "border-teal-600 bg-teal-50",
    warning: "border-amber-600 bg-amber-50",
    success: "border-emerald-600 bg-emerald-50",
    danger: "border-red-600 bg-red-50",
  };
  return <div className={cn("rounded-lg border-l-4 px-4 py-3 text-sm text-slate-700", tones[tone])}>{children}</div>;
}

export function Wordmark({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Image src="/brand/logo-mark.svg" alt="" width={size} height={size} />
      <span className="font-display text-xl font-semibold text-teal-900">
        Campaignly<span className="text-orange-600">.AI</span>
      </span>
    </span>
  );
}

const ownerLinks = [
  { href: "/srs/m03", label: "Overview", icon: LayoutDashboard },
  { href: "/srs/m04", label: "Ads", icon: Sparkles },
  { href: "/srs/m08", label: "Campaigns", icon: Megaphone },
  { href: "/srs/m06", label: "Media", icon: ImageIcon },
  { href: "/srs/m10", label: "Leads", icon: Users },
  { href: "/srs/m12", label: "WhatsApp", icon: MessageCircle },
  { href: "/srs/m07", label: "Meta", icon: Link2 },
  { href: "/srs/m15", label: "Billing", icon: CreditCard },
  { href: "/srs/m16", label: "Settings", icon: Settings },
];

const adminLinks = [
  { href: "/srs/m17", label: "Operations", icon: Shield },
  { href: "/srs/m03", label: "Owner view", icon: LayoutDashboard },
];

function Shell({
  links,
  active,
  workspace,
  name,
  children,
}: {
  links: typeof ownerLinks;
  active: string;
  workspace: string;
  name: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--surface)] bg-dash-grid bg-grid">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <aside className="hidden w-64 shrink-0 border-r border-[var(--line)] bg-white/90 p-4 md:flex md:flex-col">
          <Link href="/srs/m03">
            <Wordmark />
          </Link>
          <p className="mt-1 truncate text-xs text-slate-500">{workspace}</p>
          <nav className="mt-8 flex flex-1 flex-col gap-1">
            {links.map((l) => {
              const Icon = l.icon;
              return (
                <Link
                  key={l.label}
                  href={l.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                    l.label === active ? "bg-teal-700 text-white" : "text-slate-600 hover:bg-teal-50",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {l.label}
                </Link>
              );
            })}
          </nav>
          <button type="button" className="btn-secondary mt-4 w-full justify-start">
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 items-center justify-between border-b border-[var(--line)] bg-white/80 px-6 backdrop-blur">
            <div className="text-sm text-slate-500">
              Signed in as <span className="font-medium text-slate-800">{name}</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/srs/m14" data-hot="Notifications" className="relative rounded-lg p-2 hover:bg-teal-50">
                <Bell className="h-5 w-5 text-slate-600" />
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-orange-500" />
              </Link>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-700 text-xs font-bold text-white">
                {name.slice(0, 1)}
              </div>
            </div>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}

export function OwnerShell({ active, children }: { active: string; children: React.ReactNode }) {
  return (
    <Shell links={ownerLinks} active={active} workspace="Pulse Fit Studio" name="Alex Rivera">
      {children}
    </Shell>
  );
}

const adminTabs = [
  ["Overview", "/srs/m17"],
  ["Users", "/srs/m17"],
  ["AI usage", "/srs/m17"],
  ["Meta health", "/srs/m17"],
  ["Jobs", "/srs/m17"],
  ["Knowledge base", "/srs/m18"],
  ["Referrals", "/srs/m18"],
  ["Enquiries", "/srs/m18"],
];

export function AdminShell({ tab, children }: { tab: string; children: React.ReactNode }) {
  return (
    <Shell links={adminLinks} active="Operations" workspace="Platform Admin" name="Platform Admin">
      <div className="mb-6 flex gap-1 border-b border-[var(--line)]">
        {adminTabs.map(([t, href]) => (
          <Link
            key={t}
            href={href}
            className={cn(
              "-mb-px border-b-2 px-3 py-2.5 text-sm font-medium",
              t === tab ? "border-teal-700 text-teal-800" : "border-transparent text-slate-500 hover:text-teal-800",
            )}
          >
            {t}
          </Link>
        ))}
      </div>
      {children}
    </Shell>
  );
}

const navLinks = [
  ["Product", "/srs/m19"],
  ["Pricing", "/srs/m20"],
  ["Diagnostic", "/srs/m21"],
  ["Blog", "/srs/m19"],
  ["About", "/srs/m19"],
  ["Contact", "/srs/m21"],
];

export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-teal-900/10 bg-[#ecfdf5]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/srs/m19">
          <Wordmark size={32} />
        </Link>
        <nav className="flex items-center gap-6">
          {navLinks.map(([l, h]) => (
            <Link key={l} href={h} className="text-sm font-medium text-slate-600 hover:text-teal-800">
              {l}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/srs/m01" className="btn-ghost">
            Log in
          </Link>
          <Link href="/srs/m01" className="btn-primary">
            Start free trial
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--line)] bg-teal-950 text-teal-50">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <span className="inline-flex items-center gap-2">
            <Image src="/brand/logo-mark.svg" alt="" width={28} height={28} />
            <span className="font-display text-xl font-semibold">
              Campaignly<span className="text-orange-400">.AI</span>
            </span>
          </span>
          <p className="mt-3 max-w-md text-sm text-teal-100/80">
            Guided Meta advertising, lead management and WhatsApp nurturing for businesses in every industry.
          </p>
        </div>
        <div>
          <div className="text-sm font-semibold">Product</div>
          <div className="mt-3 flex flex-col gap-2 text-sm text-teal-100/80">
            <span>Pricing</span>
            <span>Campaign diagnostic</span>
            <span>Blog</span>
            <span>Dashboard login</span>
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold">Company</div>
          <div className="mt-3 flex flex-col gap-2 text-sm text-teal-100/80">
            <span>About</span>
            <span>Contact</span>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </div>
      <div className="border-t border-teal-900 px-6 py-4 text-center text-xs text-teal-200/70">© 2026 Campaignly.AI · All rights reserved</div>
    </footer>
  );
}

export function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--line)] py-2 text-sm last:border-0">
      <span className="text-slate-500">{k}</span>
      <span className="font-medium text-slate-800">{v}</span>
    </div>
  );
}

export function Spark({ points, color = "#0f766e" }: { points: number[]; color?: string }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const d = points.map((p, i) => `${(i / (points.length - 1)) * 100},${30 - ((p - min) / (max - min || 1)) * 26 - 2}`).join(" ");
  return (
    <svg viewBox="0 0 100 30" className="mt-2 h-8 w-full" preserveAspectRatio="none">
      <polyline points={d} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
