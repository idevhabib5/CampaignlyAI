"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { BRAND_TONES, COMMUNICATION_STYLES, INDUSTRIES, parseJson } from "@/lib/utils";

type Business = {
  businessName: string;
  industry: string;
  category: string | null;
  brandTone: string;
  communicationStyle: string;
  targetAudience: string | null;
  website: string | null;
  location: string | null;
  services: string | null;
  brandColors: string | null;
  logoUrl: string | null;
  aiRecommendations: string | null;
};

type Recs = {
  suggestedAudience?: string;
  suggestedTone?: string;
  suggestedBudget?: number;
  suggestedCategory?: string;
  tips?: string[];
  source?: string;
  model?: string;
};

export function BusinessProfileForm({
  initial,
  aiMode,
}: {
  initial: Business | null;
  aiMode: string;
}) {
  const router = useRouter();
  const colors = parseJson<{ primary?: string; secondary?: string }>(initial?.brandColors, {});
  const [form, setForm] = useState({
    businessName: initial?.businessName || "",
    industry: initial?.industry || "Fitness",
    category: initial?.category || "",
    brandTone: initial?.brandTone || "professional",
    communicationStyle: initial?.communicationStyle || "friendly",
    targetAudience: initial?.targetAudience || "",
    website: initial?.website || "",
    location: initial?.location || "",
    services: initial?.services || "",
    primaryColor: colors.primary || "#0F766E",
    secondaryColor: colors.secondary || "#F97316",
    logoUrl: initial?.logoUrl || "",
  });
  const [recs, setRecs] = useState<Recs | null>(
    parseJson(initial?.aiRecommendations, null)
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(refreshRecommendations: boolean) {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/onboarding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          brandColors: JSON.stringify({
            primary: form.primaryColor,
            secondary: form.secondaryColor,
          }),
          logoUrl: form.logoUrl || undefined,
          complete: true,
          refreshRecommendations,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setRecs(parseJson(data.business?.aiRecommendations, null));
      setMessage(
        refreshRecommendations
          ? "Profile saved and AI recommendations refreshed."
          : "Business profile saved."
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    submit(false);
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold text-teal-950">Business profile & branding</h2>
          <p className="mt-1 text-xs text-slate-500">
            Stored for AI personalization. AI mode:{" "}
            {aiMode === "live" ? (
              <span className="font-semibold text-emerald-700">Live (Gemini → Groq)</span>
            ) : (
              <span className="font-semibold text-amber-700">Mock / unconfigured</span>
            )}
          </p>
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {message && (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</div>
      )}

      <div>
        <label className="label">Business name</label>
        <input
          className="input"
          required
          value={form.businessName}
          onChange={(e) => setForm({ ...form, businessName: e.target.value })}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Industry</label>
          <select
            className="input"
            value={form.industry}
            onChange={(e) => setForm({ ...form, industry: e.target.value })}
          >
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Service category</label>
          <input
            className="input"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Brand tone</label>
          <select
            className="input"
            value={form.brandTone}
            onChange={(e) => setForm({ ...form, brandTone: e.target.value })}
          >
            {BRAND_TONES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Communication style</label>
          <select
            className="input"
            value={form.communicationStyle}
            onChange={(e) => setForm({ ...form, communicationStyle: e.target.value })}
          >
            {COMMUNICATION_STYLES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Target audience</label>
        <textarea
          className="input min-h-[70px]"
          value={form.targetAudience}
          onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
        />
      </div>
      <div>
        <label className="label">Services</label>
        <textarea
          className="input min-h-[70px]"
          value={form.services}
          onChange={(e) => setForm({ ...form, services: e.target.value })}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Location</label>
          <input
            className="input"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Website</label>
          <input
            className="input"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Primary color</label>
          <div className="flex gap-2">
            <input
              type="color"
              className="h-11 w-14 rounded border border-[var(--line)]"
              value={form.primaryColor}
              onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
            />
            <input
              className="input"
              value={form.primaryColor}
              onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="label">Secondary color</label>
          <div className="flex gap-2">
            <input
              type="color"
              className="h-11 w-14 rounded border border-[var(--line)]"
              value={form.secondaryColor}
              onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })}
            />
            <input
              className="input"
              value={form.secondaryColor}
              onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })}
            />
          </div>
        </div>
      </div>
      <div>
        <label className="label">Logo URL</label>
        <input
          className="input"
          value={form.logoUrl}
          onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
        />
      </div>

      {recs && (
        <div className="rounded-lg bg-teal-50 p-3 text-sm text-teal-900">
          <div className="font-semibold">Stored AI recommendations</div>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-teal-900/80">
            {recs.suggestedAudience && <li>{recs.suggestedAudience}</li>}
            {recs.suggestedBudget && <li>Budget ${recs.suggestedBudget}/day</li>}
            {recs.tips?.slice(0, 3).map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          {recs.source && (
            <p className="mt-2 text-xs text-teal-800/70">
              Source: {recs.source}
              {recs.model ? ` · ${recs.model}` : ""}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button className="btn-primary" disabled={saving}>
          {saving ? "Saving..." : "Save profile"}
        </button>
        <button
          type="button"
          className="btn-secondary"
          disabled={saving}
          onClick={() => submit(true)}
        >
          Save + refresh AI tips
        </button>
      </div>
    </form>
  );
}
