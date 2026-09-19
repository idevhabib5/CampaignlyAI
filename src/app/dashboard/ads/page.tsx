"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { INDUSTRIES, parseJson } from "@/lib/utils";

type Creative = {
  id: string;
  headline: string;
  primaryText: string;
  description: string | null;
  cta: string;
  variations: string | null;
  complianceScore: number;
  complianceNotes: string | null;
  status: string;
  templateId?: string | null;
  createdAt: string;
};

const TEMPLATES = [
  { id: "fitness-lead-gen", name: "Fitness lead gen", blurb: "Trials & PT packages", industry: "Fitness" },
  { id: "ecommerce-promo", name: "Ecommerce promo", blurb: "Offers & bestsellers", industry: "Ecommerce" },
  { id: "real-estate-lead-gen", name: "Real estate leads", blurb: "Listings & valuations", industry: "Real Estate" },
  { id: "beauty-booking", name: "Beauty booking", blurb: "Spa & salon offers", industry: "Beauty" },
  { id: "healthcare-booking", name: "Healthcare booking", blurb: "Appointments & care", industry: "Healthcare" },
  { id: "education-enroll", name: "Education enroll", blurb: "Courses & demos", industry: "Education" },
  { id: "local-services", name: "Local services", blurb: "Bookings & quotes", industry: "Local Services" },
  { id: "restaurant-reserve", name: "Restaurant reserve", blurb: "Tables & specials", industry: "Restaurant" },
  { id: "coaching-discovery", name: "Coaching discovery", blurb: "Calls & programs", industry: "Coaching" },
];

export default function AdsPage() {
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [insights, setInsights] = useState<string[]>([]);
  const [recs, setRecs] = useState<string[]>([]);
  const [policyChecks, setPolicyChecks] = useState<string[]>([]);
  const [latest, setLatest] = useState<Creative | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [ragExampleCount, setRagExampleCount] = useState(0);
  const [aiMode, setAiMode] = useState<"live" | "mock_or_unconfigured">("mock_or_unconfigured");
  const [providers, setProviders] = useState<{ gemini?: boolean; groq?: boolean }>({});
  const [form, setForm] = useState({
    objective: "LEAD_GENERATION",
    ageMin: 25,
    ageMax: 45,
    gender: "all",
    templateId: "fitness-lead-gen",
  });

  async function load() {
    const res = await fetch("/api/ads");
    const data = await res.json();
    setCreatives(data.creatives || []);
    setAiMode(data.aiMode === "live" ? "live" : "mock_or_unconfigured");
    setProviders(data.providers || {});
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function generate(e: FormEvent) {
    e.preventDefault();
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setLatest(data.creative);
      setInsights(data.ragInsights || []);
      setRecs(data.recommendations || []);
      setPolicyChecks(data.policyChecks || []);
      setSource(data.source || null);
      setModel(data.model || null);
      setRagExampleCount(data.ragExampleCount || 0);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function removeCreative(id: string) {
    if (!confirm("Delete this advertisement?")) return;
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/ads?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      if (latest?.id === id) setLatest(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  function selectCreative(c: Creative) {
    setLatest(c);
    setInsights([]);
    setRecs([]);
    setPolicyChecks([]);
    setSource(null);
    setModel(null);
  }

  const variations = parseJson<Array<{ headline: string; primaryText: string }>>(
    latest?.variations,
    []
  );

  return (
    <div>
      <PageHeader
        title="AI Ad Generator"
        description="Industry templates, RAG insights from high-performing ads, and Bradley Filter compliance."
      />
      <p className="mb-4 text-xs text-slate-500">
        AI:{" "}
        {aiMode === "live" ? (
          <span className="font-semibold text-emerald-700">
            Live
            {providers.gemini && providers.groq
              ? " (Gemini primary, Groq fallback)"
              : providers.gemini
                ? " (Gemini)"
                : " (Groq)"}
          </span>
        ) : (
          <span className="font-semibold text-amber-700">Mock / unconfigured</span>
        )}
        {source && (
          <span className="ml-2 text-slate-600">
            · last run: {source}
            {model ? ` / ${model}` : ""}
          </span>
        )}
      </p>

      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-teal-950">
          Template library ({INDUSTRIES.length} industries)
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setForm({ ...form, templateId: t.id })}
              className={`card p-4 text-left transition ${
                form.templateId === t.id ? "ring-2 ring-teal-700" : "hover:bg-teal-50/50"
              }`}
            >
              <div className="font-semibold text-teal-950">{t.name}</div>
              <div className="mt-1 text-xs text-slate-500">
                {t.industry} · {t.blurb}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={generate} className="card space-y-4 p-5">
          <h2 className="font-semibold text-teal-950">Campaign configuration</h2>
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div>
            <label className="label">Objective</label>
            <select
              className="input"
              value={form.objective}
              onChange={(e) => setForm({ ...form, objective: e.target.value })}
            >
              <option value="LEAD_GENERATION">Lead generation</option>
              <option value="TRAFFIC">Traffic</option>
              <option value="AWARENESS">Awareness</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Age min</label>
              <input
                className="input"
                type="number"
                value={form.ageMin}
                onChange={(e) => setForm({ ...form, ageMin: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="label">Age max</label>
              <input
                className="input"
                type="number"
                value={form.ageMax}
                onChange={(e) => setForm({ ...form, ageMax: Number(e.target.value) })}
              />
            </div>
          </div>
          <div>
            <label className="label">Gender</label>
            <select
              className="input"
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            >
              <option value="all">All</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Selected template: <span className="font-semibold">{form.templateId}</span>
          </div>
          <button className="btn-primary w-full" disabled={generating}>
            {generating ? "Generating with AI..." : "Generate ad variations"}
          </button>
        </form>

        <div className="card p-5">
          <h2 className="font-semibold text-teal-950">Generated content</h2>
          {!latest && !generating && (
            <p className="mt-4 text-sm text-slate-500">
              Configure audience settings and generate to see headlines, primary text, and compliance.
            </p>
          )}
          {generating && (
            <p className="mt-4 text-sm text-teal-700">
              Running live generation + Bradley Filter + RAG retrieval…
            </p>
          )}
          {latest && (
            <div className="mt-4 space-y-4">
              <div className="rounded-xl bg-teal-50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold text-teal-950">{latest.headline}</div>
                  <span className="badge bg-emerald-100 text-emerald-800">
                    Compliance {latest.complianceScore}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm text-teal-900/90">{latest.primaryText}</p>
                <div className="mt-3 text-xs font-semibold text-teal-800">CTA: {latest.cta}</div>
              </div>
              {variations.length > 0 && (
                <div>
                  <div className="text-sm font-semibold text-slate-800">Variations</div>
                  <div className="mt-2 space-y-2">
                    {variations.map((v, i) => (
                      <div key={i} className="rounded-lg border border-[var(--line)] p-3 text-sm">
                        <div className="font-medium">{v.headline}</div>
                        <div className="mt-1 text-slate-600">{v.primaryText}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {insights.length > 0 && (
                <div className="rounded-xl border border-teal-200 bg-white p-4">
                  <div className="text-sm font-semibold text-teal-950">RAG retrieval insights</div>
                  <p className="mt-1 text-xs text-slate-500">
                    Retrieved {ragExampleCount} high-performing ads (compliance ≥ 85) from your
                    library / platform dataset.
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                    {insights.map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                </div>
              )}
              {latest.complianceNotes && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="text-sm font-semibold text-amber-900">Bradley Filter (compliance)</div>
                  <p className="mt-2 text-sm text-amber-900/90">{latest.complianceNotes}</p>
                  <p className="mt-1 text-xs text-amber-800">
                    Score {latest.complianceScore}/100 — Meta advertising policy review via AI.
                  </p>
                  {policyChecks.length > 0 && (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-amber-900/80">
                      {policyChecks.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {recs.length > 0 && (
                <div>
                  <div className="text-sm font-semibold text-slate-800">Campaign recommendations</div>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                    {recs.map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                </div>
              )}
              <Link
                href={`/dashboard/campaigns?creativeId=${latest.id}`}
                className="btn-primary inline-flex"
              >
                Deploy to Meta campaign
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="mb-3 font-semibold text-teal-950">Saved advertisements</h2>
        {loading ? (
          <div className="text-sm text-slate-500">Loading...</div>
        ) : creatives.length === 0 ? (
          <EmptyState
            title="No ads yet"
            description="Generate your first AI advertisement to populate this library."
          />
        ) : (
          <div className="card overflow-hidden">
            <div className="divide-y divide-[var(--line)]">
              {creatives.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <button
                    type="button"
                    className="text-left"
                    onClick={() => selectCreative(c)}
                  >
                    <div className="font-medium text-slate-900">{c.headline}</div>
                    <div className="text-xs text-slate-500">
                      Score {c.complianceScore}
                      {c.templateId ? ` · ${c.templateId}` : ""} ·{" "}
                      {new Date(c.createdAt).toLocaleString()}
                    </div>
                  </button>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={c.status.toUpperCase()} />
                    <Link href={`/dashboard/campaigns?creativeId=${c.id}`} className="btn-secondary">
                      Use in campaign
                    </Link>
                    <button
                      type="button"
                      className="btn-secondary text-red-700"
                      disabled={busyId === c.id}
                      onClick={() => removeCreative(c.id)}
                    >
                      {busyId === c.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
