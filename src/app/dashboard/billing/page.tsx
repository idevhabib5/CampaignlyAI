"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { PLANS } from "@/lib/utils";

type Subscription = {
  plan: string;
  status: string;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
};

function BillingClient() {
  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    const res = await fetch("/api/billing");
    const data = await res.json();
    setSubscription(data.subscription);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const success = searchParams.get("checkout");
    const plan = searchParams.get("plan");
    if (success === "success" && plan) {
      (async () => {
        setBusy(true);
        await fetch("/api/billing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "complete_checkout", plan }),
        });
        setMessage(`Mock Stripe checkout completed for ${plan}.`);
        setBusy(false);
        await load();
      })();
    }
  }, [searchParams]);

  async function checkout(plan: string) {
    setBusy(true);
    setMessage("");
    const res = await fetch("/api/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "checkout", plan }),
    });
    const data = await res.json();
    window.location.href = data.checkout.checkoutUrl;
  }

  async function portal() {
    setBusy(true);
    const res = await fetch("/api/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "portal" }),
    });
    const data = await res.json();
    setMessage("Opened mock billing portal.");
    setBusy(false);
    window.location.href = data.portal.url;
  }

  return (
    <div>
      <PageHeader
        title="Billing & subscriptions"
        description="Stripe checkout, trials, and plan management — mocked for this demo product."
        actions={
          <button className="btn-secondary" disabled={busy} onClick={portal}>
            Billing portal
          </button>
        }
      />

      {message && (
        <div className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</div>
      )}

      <div className="card mb-6 p-5">
        <div className="text-sm text-slate-500">Current plan</div>
        <div className="mt-1 font-display text-3xl font-semibold text-teal-950">
          {subscription?.plan || "—"}
        </div>
        <div className="mt-1 text-sm text-slate-600">
          Status: {subscription?.status || "none"}
          {subscription?.currentPeriodEnd &&
            ` · renews ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`}
          {subscription?.trialEndsAt &&
            ` · trial ends ${new Date(subscription.trialEndsAt).toLocaleDateString()}`}
        </div>
        {subscription?.stripeCustomerId && (
          <div className="mt-2 text-xs text-slate-500">
            Stripe customer: {subscription.stripeCustomerId}
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
            <button
              className="btn-primary mt-5 w-full"
              disabled={busy || subscription?.plan === plan.id}
              onClick={() => checkout(plan.id)}
            >
              {subscription?.plan === plan.id ? "Current plan" : "Choose plan"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="text-sm text-slate-500">Loading billing...</div>}>
      <BillingClient />
    </Suspense>
  );
}
