"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { MarketingNav } from "@/components/marketing-shell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("owner@fitstudio.demo");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResetLink(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request_password_reset", email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setMessage(data.message || "Reset ready");
      setResetLink(data.resetLink || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-hero-mesh">
      <MarketingNav />
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="font-display text-3xl font-semibold text-teal-950">Reset password</h1>
        <p className="mt-2 text-sm text-slate-600">
          Demo flow: we show the reset link in-app instead of sending email.
        </p>
        <form onSubmit={onSubmit} className="card mt-8 space-y-4 p-6">
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          {message && (
            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</div>
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
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Generating..." : "Request reset link"}
          </button>
          {resetLink && (
            <div className="rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm">
              <div className="font-semibold text-teal-950">Demo reset link</div>
              <Link href={resetLink} className="mt-2 block break-all text-teal-700 underline">
                {resetLink}
              </Link>
            </div>
          )}
        </form>
        <p className="mt-4 text-center text-sm">
          <Link href="/login" className="font-semibold text-teal-700">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
