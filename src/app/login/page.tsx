"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { MarketingNav } from "@/components/marketing-shell";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("owner@fitstudio.demo");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      router.push(data.redirectTo || "/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function continueWithGoogle() {
    setGoogleBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "google" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Google sign-in failed");
      router.push(data.redirectTo || "/onboarding");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setGoogleBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-hero-mesh">
      <MarketingNav />
      <div className="mx-auto flex max-w-md flex-col px-4 py-16">
        <h1 className="font-display text-3xl font-semibold text-teal-950">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-600">Log in to your Campaignly.AI workspace.</p>
        <form onSubmit={onSubmit} className="card mt-8 space-y-4 p-6">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-xs font-medium text-teal-700 hover:underline">
              Forgot password?
            </Link>
          </div>
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
          <div className="relative py-1 text-center text-xs text-slate-400">
            <span className="bg-white px-2 relative z-10">or</span>
            <div className="absolute inset-x-0 top-1/2 border-t border-[var(--line)]" />
          </div>
          <button
            type="button"
            className="btn-secondary w-full"
            disabled={googleBusy}
            onClick={continueWithGoogle}
          >
            {googleBusy ? "Connecting..." : "Continue with Google"}
          </button>
          <p className="text-center text-[11px] text-slate-500">
            Mock OAuth — creates/logs in <code>google.demo@campaignly.ai</code>
          </p>
          <div className="rounded-lg bg-teal-50 p-3 text-xs text-teal-900">
            <div className="font-semibold">Demo accounts</div>
            <div>owner@fitstudio.demo / demo1234</div>
            <div>admin@campaignly.ai / demo1234</div>
            <div>newbie@demo.com / demo1234</div>
          </div>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">
          No account?{" "}
          <Link href="/register" className="font-semibold text-teal-700">
            Start free trial
          </Link>
        </p>
      </div>
    </div>
  );
}
