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
  durationSec: number | null;
  brandApplied: boolean;
  captions: string | null;
  notes: string | null;
  createdAt: string;
};

type Placement = { name: string; width: number; height: number };

export default function MediaPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Asset | null>(null);
  const [message, setMessage] = useState("");
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
    setMessage("");
    const res = await fetch("/api/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);
    if (data.asset) {
      setMessage(`Uploaded ${data.asset.filename} via mock S3.`);
      setSelected(data.asset);
      await load();
    }
  }

  async function enhance(asset: Asset, action: "captions" | "brand" | "resize") {
    setBusy(true);
    setMessage("");
    // Re-upload simulation with enhancement flags (mock edit pipeline)
    const res = await fetch("/api/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: `${action}-${asset.filename}`,
        mimeType: asset.mediaType === "video" ? "video/mp4" : "image/jpeg",
        applyBrand: action === "brand" || asset.brandApplied,
        generateCaptions: action === "captions" || Boolean(asset.captions),
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.asset) {
      setMessage(
        action === "captions"
          ? "Generated captions/subtitles (mock)."
          : action === "brand"
            ? "Applied brand colors/logo (mock)."
            : "Created placement-resized variant (mock)."
      );
      setSelected(data.asset);
      await load();
    }
  }

  return (
    <div>
      <PageHeader
        title="Media library"
        description="Upload creatives (mock S3), apply branding, generate captions, and prepare Meta placements."
      />
      {message && (
        <div className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</div>
      )}

      <form onSubmit={upload} className="card mb-6 grid gap-4 p-5 md:grid-cols-2">
        <div>
          <label className="label">Filename</label>
          <input
            className="input"
            value={form.filename}
            onChange={(e) => setForm({ ...form, filename: e.target.value })}
            required
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
          Apply brand colors / logo
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.generateCaptions}
            onChange={(e) => setForm({ ...form, generateCaptions: e.target.checked })}
          />
          Generate captions / subtitles
        </label>
        <div className="md:col-span-2">
          <button className="btn-primary" disabled={busy}>
            {busy ? "Working..." : "Upload media (mock S3)"}
          </button>
        </div>
      </form>

      <div className="mb-4 text-sm text-slate-600">
        Placement presets:{" "}
        {placements.map((p) => `${p.name} (${p.width}×${p.height})`).join(" · ")}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {loading ? (
            <div className="text-sm text-slate-500">Loading...</div>
          ) : assets.length === 0 ? (
            <EmptyState
              title="No media yet"
              description="Upload an image or video asset to populate your creative library."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {assets.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setSelected(a)}
                  className={`card overflow-hidden text-left transition ${
                    selected?.id === a.id ? "ring-2 ring-teal-700" : ""
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.url} alt={a.filename} className="aspect-square w-full object-cover" />
                  <div className="p-3">
                    <div className="font-medium text-slate-900">{a.filename}</div>
                    <div className="text-xs text-slate-500">
                      {a.mediaType} · {a.width}×{a.height}
                      {a.brandApplied ? " · branded" : ""}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5 h-fit">
          <h2 className="font-semibold text-teal-950">Creative tools</h2>
          {!selected ? (
            <p className="mt-3 text-sm text-slate-500">Select an asset to edit.</p>
          ) : (
            <div className="mt-4 space-y-3 text-sm">
              <div className="font-medium">{selected.filename}</div>
              {selected.captions && (
                <p className="rounded-lg bg-teal-50 p-2 text-xs text-teal-900">{selected.captions}</p>
              )}
              <button
                className="btn-secondary w-full"
                disabled={busy}
                onClick={() => enhance(selected, "captions")}
              >
                Generate captions
              </button>
              <button
                className="btn-secondary w-full"
                disabled={busy}
                onClick={() => enhance(selected, "brand")}
              >
                Apply branding
              </button>
              <button
                className="btn-secondary w-full"
                disabled={busy}
                onClick={() => enhance(selected, "resize")}
              >
                Create placement sizes
              </button>
              <p className="text-xs text-slate-500">
                Edits run through the mock media pipeline (trim/caption/resize simulated).
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
