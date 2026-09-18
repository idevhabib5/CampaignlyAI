"use client";

import { FormEvent, useEffect, useState } from "react";
import { EmptyState, PageHeader } from "@/components/ui";

type Asset = {
  id: string;
  filename: string;
  mediaType: string;
  url: string;
  width: number | null;
  height: number | null;
  brandApplied: boolean;
  captions: string | null;
  createdAt: string;
};

export default function MediaPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [placements, setPlacements] = useState<Array<{ name: string; width: number; height: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    filename: "promo-creative.jpg",
    mimeType: "image/jpeg",
    applyBrand: true,
    generateCaptions: false,
  });

  async function load() {
    const res = await fetch("/api/media");
    const data = await res.json();
    setAssets(data.assets || []);
    setPlacements(data.placements || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function upload(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    await fetch("/api/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setBusy(false);
    await load();
  }

  return (
    <div>
      <PageHeader
        title="Media library"
        description="Upload creatives via mock S3, apply branding, and prepare Meta placements."
      />

      <form onSubmit={upload} className="card mb-6 grid gap-4 p-5 md:grid-cols-2">
        <div>
          <label className="label">Filename</label>
          <input
            className="input"
            value={form.filename}
            onChange={(e) => setForm({ ...form, filename: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Type</label>
          <select
            className="input"
            value={form.mimeType}
            onChange={(e) => setForm({ ...form, mimeType: e.target.value })}
          >
            <option value="image/jpeg">Image (JPEG)</option>
            <option value="image/png">Image (PNG)</option>
            <option value="video/mp4">Video (MP4)</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.applyBrand}
            onChange={(e) => setForm({ ...form, applyBrand: e.target.checked })}
          />
          Apply brand colors / logo (mock)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.generateCaptions}
            onChange={(e) => setForm({ ...form, generateCaptions: e.target.checked })}
          />
          Generate captions / subtitles (mock)
        </label>
        <div className="md:col-span-2">
          <button className="btn-primary" disabled={busy}>
            {busy ? "Uploading..." : "Upload media (mock S3)"}
          </button>
        </div>
      </form>

      <div className="mb-4 text-sm text-slate-600">
        Placement presets:{" "}
        {placements.map((p) => `${p.name} (${p.width}×${p.height})`).join(" · ")}
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Loading...</div>
      ) : assets.length === 0 ? (
        <EmptyState title="No media yet" description="Upload an image or video asset to get started." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((a) => (
            <div key={a.id} className="card overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.url} alt={a.filename} className="aspect-square w-full object-cover" />
              <div className="p-3">
                <div className="font-medium text-slate-900">{a.filename}</div>
                <div className="text-xs text-slate-500">
                  {a.mediaType} · {a.width}×{a.height}
                  {a.brandApplied ? " · branded" : ""}
                </div>
                {a.captions && <p className="mt-2 text-xs text-teal-800">{a.captions}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
