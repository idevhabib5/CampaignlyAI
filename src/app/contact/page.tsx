"use client";

import { FormEvent, useState } from "react";
import { MarketingFooter, MarketingNav } from "@/components/marketing-shell";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "contact", ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-hero-mesh">
      <MarketingNav />
      <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-4xl font-semibold text-teal-950">Contact</h1>
        <p className="mt-2 text-slate-600">Questions about the POC or a future production rollout?</p>
        {done ? (
          <div className="card mt-8 p-6 text-sm text-emerald-800">
            Thanks — your enquiry was saved. Admins can see it in the operations dashboard.
          </div>
        ) : (
          <form onSubmit={onSubmit} className="card mt-8 space-y-4 p-6">
            {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            {(["name", "email", "company"] as const).map((key) => (
              <div key={key}>
                <label className="label capitalize">{key}</label>
                <input
                  className="input"
                  type={key === "email" ? "email" : "text"}
                  required={key !== "company"}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </div>
            ))}
            <div>
              <label className="label">Message</label>
              <textarea
                className="input min-h-[120px]"
                required
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </div>
            <button className="btn-primary w-full" disabled={loading}>
              {loading ? "Sending..." : "Send message"}
            </button>
          </form>
        )}
      </div>
      <MarketingFooter />
    </div>
  );
}
