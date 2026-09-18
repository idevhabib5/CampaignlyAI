"use client";

import { FormEvent, useState } from "react";
import { MarketingFooter, MarketingNav } from "@/components/marketing-shell";
import { INDUSTRIES } from "@/lib/utils";

export default function DiagnosticPage() {
  const [form, setForm] = useState({
    businessName: "",
    industry: "Fitness",
    email: "",
    monthlySpend: 300,
    hasCreativeProcess: false,
    tracksLeads: false,
  });
  const [result, setResult] = useState<{ score: number; recommendations: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "diagnostic", ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setResult({ score: data.score, recommendations: data.recommendations });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-hero-mesh">
      <MarketingNav />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 lg:grid-cols-2 sm:px-6">
        <div>
          <h1 className="font-display text-4xl font-semibold text-teal-950">Campaign diagnostic</h1>
          <p className="mt-3 text-slate-600">
            Free AI-powered assessment of your Meta advertising readiness. Results are stored for
            follow-up in this POC.
          </p>
          <form onSubmit={onSubmit} className="card mt-8 space-y-4 p-6">
            {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            <div>
              <label className="label">Business name</label>
              <input
                className="input"
                required
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Industry</label>
              <select
                className="input"
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
              >
                {INDUSTRIES.map((i) => (
                  <option key={i}>{i}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Monthly Meta spend ($)</label>
              <input
                className="input"
                type="number"
                value={form.monthlySpend}
                onChange={(e) => setForm({ ...form, monthlySpend: Number(e.target.value) })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.hasCreativeProcess}
                onChange={(e) => setForm({ ...form, hasCreativeProcess: e.target.checked })}
              />
              We have a repeatable creative process
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.tracksLeads}
                onChange={(e) => setForm({ ...form, tracksLeads: e.target.checked })}
              />
              We track leads in one place
            </label>
            <button className="btn-primary w-full" disabled={loading}>
              {loading ? "Analyzing..." : "Run diagnostic"}
            </button>
          </form>
        </div>
        <div className="card p-6">
          <h2 className="font-semibold text-teal-950">Results</h2>
          {!result ? (
            <p className="mt-4 text-sm text-slate-500">Submit the form to see your readiness score.</p>
          ) : (
            <div className="mt-4">
              <div className="font-display text-5xl font-semibold text-teal-800">{result.score}</div>
              <div className="text-sm text-slate-500">Readiness score / 100</div>
              <ul className="mt-6 list-disc space-y-2 pl-5 text-sm text-slate-700">
                {result.recommendations.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      <MarketingFooter />
    </div>
  );
}
