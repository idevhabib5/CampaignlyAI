import Link from "next/link";
import { MarketingFooter, MarketingNav } from "@/components/marketing-shell";

const plans = [
  {
    name: "Trial",
    price: "Free",
    detail: "14-day demo access",
    features: ["AI ad generation", "1 campaign path", "Leads + WhatsApp"],
  },
  {
    name: "Pro",
    price: "$129",
    detail: "per month (illustrative)",
    features: ["Unlimited ads (mock)", "Campaign deploy", "Lead scoring", "WhatsApp agent"],
    popular: true,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-hero-mesh">
      <MarketingNav />
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-4xl font-semibold text-teal-950">Pricing</h1>
        <p className="mt-2 text-slate-600">
          Illustrative plans for the MVP. Checkout UI is demoted — use the demo account to explore
          the product.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`card flex flex-col p-6 ${plan.popular ? "ring-2 ring-teal-700" : ""}`}
            >
              <div className="font-semibold text-teal-950">{plan.name}</div>
              <div className="mt-2 font-display text-3xl font-semibold">{plan.price}</div>
              <div className="text-sm text-slate-500">{plan.detail}</div>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-600">
                {plan.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              <Link href="/login" className="btn-primary mt-6 text-center">
                Try the demo
              </Link>
            </div>
          ))}
        </div>
      </div>
      <MarketingFooter />
    </div>
  );
}
