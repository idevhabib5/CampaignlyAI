/**
 * Stripe Subscription Billing (MOCK)
 * Scope Module 7 — checkout, portal, webhooks, trial.
 */

export type CheckoutResult = {
  mock: true;
  checkoutUrl: string;
  sessionId: string;
  plan: string;
};

export async function createCheckoutSession(userId: string, plan: string): Promise<CheckoutResult> {
  await delay(400);
  const sessionId = `cs_test_mock_${Date.now().toString(36)}`;
  return {
    mock: true,
    sessionId,
    plan,
    checkoutUrl: `/dashboard/billing?checkout=success&session_id=${sessionId}&plan=${plan}&user=${userId}`,
  };
}

export async function createBillingPortalSession(userId: string) {
  await delay(300);
  return {
    mock: true,
    url: `/dashboard/billing?portal=1&user=${userId}`,
  };
}

export function applyMockWebhook(plan: string) {
  const trialEndsAt =
    plan === "TRIAL" ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : null;
  return {
    plan,
    status: plan === "TRIAL" ? "TRIALING" : "ACTIVE",
    stripeCustomerId: `cus_mock_${Date.now().toString(36)}`,
    stripeSubscriptionId: `sub_mock_${Date.now().toString(36)}`,
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    trialEndsAt,
  };
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
