"use client";

import { FormEvent, useEffect, useState } from "react";
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
  onboardingStep: number;
  onboardingComplete: boolean;
  aiRecommendations: string | null;
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
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
  });
  const [recs, setRecs] = useState<{
    suggestedAudience?: string;
    suggestedTone?: string;
    suggestedBudget?: number;
    tips?: string[];
  } | null>(null);

  useEffect(() => {
    fetch("/api/onboarding")
      .then((r) => r.json())
      .then((data) => {
        if (data.business) {
          const b = data.business as Business;
          // Allow editing completed profiles (settings links here)
          setStep(b.onboardingComplete ? 1 : b.onboardingStep || 1);
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
          });
          setRecs(parseJson(b.aiRecommendations, null));
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function save(nextStep: number, complete = false) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/onboarding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, step: nextStep, complete }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setRecs(parseJson(data.business?.aiRecommendations, null));
      if (complete) {
        router.push("/dashboard");
        router.refresh();
        return;
      }
      setStep(nextStep);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function onNext(e: FormEvent) {
    e.preventDefault();
    if (step < 4) save(step + 1);
    else save(5, true);
  }

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-slate-600">Loading onboarding...</div>;
  }

  return (
    <div className="min-h-screen bg-hero-mesh">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="font-display text-2xl font-semibold text-teal-950">
          Campaignly<span className="text-orange-600">.AI</span>
        </div>
        <h1 className="mt-4 font-display text-3xl font-semibold text-teal-950">Business onboarding</h1>
        <p className="mt-2 text-sm text-slate-600">
          Step {Math.min(step, 4)} of 4 — progress is saved so you can resume anytime.
        </p>
        <div className="mt-4 flex gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-teal-700" : "bg-teal-100"}`}
            />
          ))}
        </div>

        <form onSubmit={onNext} className="card mt-8 space-y-4 p-6">
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          {step === 1 && (
            <>
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
                  placeholder="e.g. Gym & Personal Training"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
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
              <div>
                <label className="label">Services offered</label>
                <textarea
                  className="input min-h-[90px]"
                  value={form.services}
                  onChange={(e) => setForm({ ...form, services: e.target.value })}
                />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <label className="label">Target audience</label>
                <textarea
                  className="input min-h-[90px]"
                  placeholder="Who should see your ads?"
                  value={form.targetAudience}
                  onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Location</label>
                <input
                  className="input"
                  placeholder="City, State"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Website</label>
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
              <div className="rounded-xl bg-teal-50 p-4">
                <div className="font-semibold text-teal-900">AI onboarding recommendations</div>
                {recs ? (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-teal-900/80">
                    {recs.suggestedAudience && <li>Audience: {recs.suggestedAudience}</li>}
                    {recs.suggestedBudget && <li>Suggested daily budget: ${recs.suggestedBudget}</li>}
                    {recs.tips?.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-teal-800">Recommendations will appear after save.</p>
                )}
              </div>
              <div className="rounded-xl border border-[var(--line)] p-4 text-sm text-slate-600">
                <div className="font-semibold text-teal-950">Summary</div>
                <p className="mt-2">
                  {form.businessName} · {form.industry} · {form.brandTone} tone
                </p>
                <p className="mt-1">{form.location || "Location TBD"}</p>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button
              type="button"
              className="btn-secondary"
              disabled={step === 1 || saving}
              onClick={() => setStep((s) => Math.max(1, s - 1))}
            >
              Back
            </button>
            <button className="btn-primary" disabled={saving}>
              {saving ? "Saving..." : step === 4 ? "Finish & open dashboard" : "Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
