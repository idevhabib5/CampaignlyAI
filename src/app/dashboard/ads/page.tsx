"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { parseJson } from "@/lib/utils";

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
  createdAt: string;
};

export default function AdsPage() {
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [insights, setInsights] = useState<string[]>([]);
  const [recs, setRecs] = useState<string[]>([]);
  const [latest, setLatest] = useState<Creative | null>(null);
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
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  const variations = parseJson<Array<{ headline: string; primaryText: string }>>(
    latest?.variations,
    []
  );

  return (
    <div>
      <PageHeader
        title="AI Ad Generator"
        description="Generate Meta-ready ad copy with RAG insights and policy compliance checks (mock AI)."
      />

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
          <div>
            <label className="label">Template</label>
            <select
              className="input"
              value={form.templateId}
              onChange={(e) => setForm({ ...form, templateId: e.target.value })}
            >
              <option value="fitness-lead-gen">Fitness lead gen</option>
              <option value="ecommerce-promo">Ecommerce promo</option>
              <option value="local-services">Local services</option>
              <option value="beauty-booking">Beauty booking</option>
            </select>
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
          {generating && <p className="mt-4 text-sm text-teal-700">Running mock RAG + Bradley Filter...</p>}
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
                <p className="mt-2 text-xs text-teal-700">{latest.complianceNotes}</p>
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
                <div>
                  <div className="text-sm font-semibold text-slate-800">RAG insights</div>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                    {insights.map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                </div>
              )}
              {recs.length > 0 && (
                <div>
                  <div className="text-sm font-semibold text-slate-800">Recommendations</div>
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
                <div key={c.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-medium text-slate-900">{c.headline}</div>
                    <div className="text-xs text-slate-500">
                      Score {c.complianceScore} · {new Date(c.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={c.status.toUpperCase()} />
                    <Link href={`/dashboard/campaigns?creativeId=${c.id}`} className="btn-secondary">
                      Use in campaign
                    </Link>
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
