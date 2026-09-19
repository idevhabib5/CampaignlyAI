"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
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
  onboardingStep: number;
  onboardingComplete: boolean;
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

const TOTAL_STEPS = 4;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [aiMode, setAiMode] = useState<"live" | "mock_or_unconfigured">("mock_or_unconfigured");
  const [providers, setProviders] = useState<{ gemini?: boolean; groq?: boolean }>({});
  const [form, setForm] = useState({
    businessName: "",
    industry: "Fitness",
    category: "",
    brandTone: "professional",
    communicationStyle: "friendly",
    targetAudience: "",
    website: "",
    location: "",
    services: "",
    primaryColor: "#0F766E",
    secondaryColor: "#F97316",
    logoUrl: "",
  });
  const [recs, setRecs] = useState<Recs | null>(null);

  useEffect(() => {
    fetch("/api/onboarding")
      .then((r) => r.json())
      .then((data) => {
        setAiMode(data.aiMode === "live" ? "live" : "mock_or_unconfigured");
        setProviders(data.providers || {});
        if (data.business) {
          const b = data.business as Business;
          const colors = parseJson<{ primary?: string; secondary?: string }>(b.brandColors, {});
          const rawStep = b.onboardingComplete ? 1 : b.onboardingStep || 1;
          setStep(Math.min(Math.max(rawStep, 1), TOTAL_STEPS));
          setForm({
            businessName: b.businessName || "",
            industry: b.industry || "Fitness",
            category: b.category || "",
            brandTone: b.brandTone || "professional",
            communicationStyle: b.communicationStyle || "friendly",
            targetAudience: b.targetAudience || "",
            website: b.website || "",
            location: b.location || "",
            services: b.services || "",
            primaryColor: colors.primary || "#0F766E",
            secondaryColor: colors.secondary || "#F97316",
            logoUrl: b.logoUrl || "",
          });
          setRecs(parseJson(b.aiRecommendations, null));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function brandColorsJson() {
    return JSON.stringify({
      primary: form.primaryColor,
      secondary: form.secondaryColor,
    });
  }

  async function save(opts: {
    nextStep: number;
    complete?: boolean;
    refreshRecommendations?: boolean;
  }) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/onboarding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: form.businessName,
          industry: form.industry,
          category: form.category,
          brandTone: form.brandTone,
          communicationStyle: form.communicationStyle,
          targetAudience: form.targetAudience,
          website: form.website,
          location: form.location,
          services: form.services,
          brandColors: brandColorsJson(),
          logoUrl: form.logoUrl || undefined,
          step: opts.nextStep,
          complete: opts.complete,
          refreshRecommendations: opts.refreshRecommendations,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setRecs(parseJson(data.business?.aiRecommendations, null));
      if (opts.complete) {
        router.push("/dashboard");
        router.refresh();
        return;
      }
      setStep(opts.nextStep);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onNext(e: FormEvent) {
    e.preventDefault();
    if (step < TOTAL_STEPS) {
      const goingToRecs = step === 3;
      await save({
        nextStep: step + 1,
        refreshRecommendations: goingToRecs,
      });
      return;
    }
    await save({ nextStep: TOTAL_STEPS, complete: true, refreshRecommendations: !recs });
  }

  async function goBack() {
    const prev = Math.max(1, step - 1);
    await save({ nextStep: prev });
  }

  async function regenerate() {
    await save({ nextStep: step, refreshRecommendations: true });
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center text-slate-600">Loading onboarding...</div>
    );
  }

  return (
    <div className="min-h-screen bg-hero-mesh">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="inline-flex items-center gap-2">
          <Image src="/brand/logo-mark.svg" alt="" width={32} height={32} />
          <span className="font-display text-2xl font-semibold text-teal-950">
            Campaignly<span className="text-orange-600">.AI</span>
          </span>
        </div>
        <h1 className="mt-4 font-display text-3xl font-semibold text-teal-950">
          Set up your business
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Step {step} of {TOTAL_STEPS} — progress saves to your account so you can resume anytime.
        </p>
        <div className="mt-4 flex gap-2">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-teal-700" : "bg-teal-100"}`}
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          AI recommendations:{" "}
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
            <span className="font-semibold text-amber-700">
              Not live — set GEMINI_API_KEY / GROQ_API_KEY and USE_MOCK_AI=false
            </span>
          )}
        </p>

        <form onSubmit={onNext} className="card mt-8 space-y-4 p-6">
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          {step === 1 && (
            <>
              <h2 className="font-semibold text-teal-950">Business basics</h2>
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
                  required
                  placeholder="e.g. Gym & Personal Training"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-semibold text-teal-950">Brand voice & look</h2>
              <div className="grid gap-4 sm:grid-cols-2">
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Primary brand color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      className="h-11 w-14 cursor-pointer rounded border border-[var(--line)]"
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
                  <label className="label">Secondary brand color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      className="h-11 w-14 cursor-pointer rounded border border-[var(--line)]"
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
                <label className="label">Logo URL (optional)</label>
                <input
                  className="input"
                  placeholder="https://..."
                  value={form.logoUrl}
                  onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="font-semibold text-teal-950">Audience & services</h2>
              <div>
                <label className="label">Target audience</label>
                <textarea
                  className="input min-h-[80px]"
                  required
                  placeholder="Who should see your ads?"
                  value={form.targetAudience}
                  onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Location</label>
                <input
                  className="input"
                  required
                  placeholder="City, State"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Services / offers</label>
                <textarea
                  className="input min-h-[70px]"
                  required
                  placeholder="What do you sell or offer?"
                  value={form.services}
                  onChange={(e) => setForm({ ...form, services: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Website (optional)</label>
                <input
                  className="input"
                  type="url"
                  placeholder="https://"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                />
              </div>
            </>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-teal-950">Review & AI personalization</h2>
              <div className="rounded-xl border border-[var(--line)] p-4 text-sm text-slate-600">
                <div className="font-semibold text-teal-950">Profile summary</div>
                <p className="mt-2">
                  {form.businessName} · {form.industry}
                  {form.category ? ` · ${form.category}` : ""}
                </p>
                <p className="mt-1">
                  Tone: {form.brandTone} / {form.communicationStyle}
                </p>
                <p className="mt-1">{form.location}</p>
                {form.targetAudience && <p className="mt-1">{form.targetAudience}</p>}
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className="inline-block h-5 w-5 rounded"
                    style={{ background: form.primaryColor }}
                  />
                  <span
                    className="inline-block h-5 w-5 rounded"
                    style={{ background: form.secondaryColor }}
                  />
                  <span className="text-xs text-slate-500">Brand colors saved for media/ads</span>
                </div>
              </div>
              <div className="rounded-xl bg-teal-50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold text-teal-900">AI recommendations</div>
                  <button
                    type="button"
                    className="btn-secondary text-xs"
                    disabled={saving}
                    onClick={regenerate}
                  >
                    Regenerate
                  </button>
                </div>
                {recs ? (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-teal-900/80">
                    {recs.suggestedAudience && <li>Audience: {recs.suggestedAudience}</li>}
                    {recs.suggestedTone && <li>Suggested tone: {recs.suggestedTone}</li>}
                    {recs.suggestedBudget && (
                      <li>Suggested daily budget: ${recs.suggestedBudget}</li>
                    )}
                    {recs.suggestedCategory && <li>Category: {recs.suggestedCategory}</li>}
                    {recs.tips?.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-teal-800">
                    Generating tips for your first Meta campaign…
                  </p>
                )}
                {recs?.source && (
                  <p className="mt-3 text-xs text-teal-800/70">
                    Source: {recs.source}
                    {recs.model ? ` (${recs.model})` : ""}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button
              type="button"
              className="btn-secondary"
              disabled={step === 1 || saving}
              onClick={goBack}
            >
              Back
            </button>
            <button className="btn-primary" disabled={saving}>
              {saving
                ? "Saving..."
                : step === TOTAL_STEPS
                  ? "Finish & open dashboard"
                  : step === 3
                    ? "Generate AI tips"
                    : "Continue"}
            </button>
          </div>
        </form>

        <p className="mt-4 text-center text-xs text-slate-500">
          Already finished? Edit anytime in{" "}
          <Link href="/dashboard/settings" className="font-semibold text-teal-700">
            Settings
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
