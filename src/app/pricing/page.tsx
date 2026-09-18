import Link from "next/link";
import { MarketingFooter, MarketingNav } from "@/components/marketing-shell";
import { PLANS } from "@/lib/utils";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-hero-mesh">
      <MarketingNav />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-4xl font-semibold text-teal-950">Pricing</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Simple SaaS plans with a free trial. Checkout is mocked with Stripe-shaped flows in the POC.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`card flex flex-col p-5 ${"popular" in plan && plan.popular ? "ring-2 ring-teal-700" : ""}`}
            >
              <div className="font-semibold text-teal-950">{plan.name}</div>
              <div className="mt-2 font-display text-3xl font-semibold">
                ${plan.price}
                <span className="text-sm font-sans font-normal text-slate-500">/{plan.period}</span>
              </div>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-600">
                {plan.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              <Link href="/register" className="btn-primary mt-5 text-center">
                Get started
              </Link>
            </div>
          ))}
        </div>
      </div>
      <MarketingFooter />
    </div>
  );
}
