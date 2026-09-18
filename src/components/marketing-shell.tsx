import Link from "next/link";

const links = [
  { href: "/#features", label: "Product" },
  { href: "/pricing", label: "Pricing" },
  { href: "/diagnostic", label: "Diagnostic" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-teal-900/10 bg-[#ecfdf5]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="font-display text-2xl font-semibold tracking-tight text-teal-900">
          Campaignly<span className="text-orange-600">.AI</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-slate-600 transition hover:text-teal-800"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="btn-ghost hidden sm:inline-flex">
            Log in
          </Link>
          <Link href="/register" className="btn-primary">
            Start free trial
          </Link>
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-[var(--line)] bg-teal-950 text-teal-50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="font-display text-xl font-semibold">
            Campaignly<span className="text-orange-400">.AI</span>
          </div>
          <p className="mt-3 max-w-md text-sm text-teal-100/80">
            AI-powered Meta advertising automation for fitness, ecommerce, real estate, beauty,
            healthcare, education, and local services.
          </p>
        </div>
        <div>
          <div className="text-sm font-semibold">Product</div>
          <div className="mt-3 flex flex-col gap-2 text-sm text-teal-100/80">
            <Link href="/pricing">Pricing</Link>
            <Link href="/diagnostic">Campaign diagnostic</Link>
            <Link href="/login">Dashboard login</Link>
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold">Company</div>
          <div className="mt-3 flex flex-col gap-2 text-sm text-teal-100/80">
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-teal-900 px-4 py-4 text-center text-xs text-teal-200/70">
        © {new Date().getFullYear()} Campaignly.AI — Functional POC
      </div>
    </footer>
  );
}
