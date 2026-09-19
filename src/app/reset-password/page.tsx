"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { MarketingNav } from "@/components/marketing-shell";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_password", token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed");
      setDone(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card mt-8 space-y-4 p-6">
      {!token && (
        <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Missing token. Request a new link from{" "}
          <Link href="/forgot-password" className="underline">
            forgot password
          </Link>
          .
        </div>
      )}
      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {done && (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Password updated. Redirecting to login…
        </div>
      )}
      <div>
        <label className="label" htmlFor="password">
          New password
        </label>
        <input
          id="password"
          className="input"
          type="password"
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="confirm">
          Confirm password
        </label>
        <input
          id="confirm"
          className="input"
          type="password"
          minLength={6}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
      </div>
      <button className="btn-primary w-full" disabled={loading || !token || done}>
        {loading ? "Updating..." : "Update password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-hero-mesh">
      <MarketingNav />
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="font-display text-3xl font-semibold text-teal-950">Choose a new password</h1>
        <p className="mt-2 text-sm text-slate-600">Local demo reset — updates SQLite only.</p>
        <Suspense fallback={<div className="mt-8 text-sm text-slate-500">Loading…</div>}>
          <ResetForm />
        </Suspense>
        <p className="mt-4 text-center text-sm">
          <Link href="/login" className="font-semibold text-teal-700">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
