"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
  META_OBJECTIVES,
  META_PLACEMENTS,
  SPECIAL_AD_CATEGORIES,
  resolveLocationCandidate,
} from "@/lib/services/meta";

type Creative = {
  id: string;
  headline: string;
  primaryText?: string;
  cta?: string;
  complianceScore?: number;
  complianceNotes?: string | null;
};
type MediaItem = {
  id: string;
  filename: string;
  url: string;
  mediaType: string;
  placement?: string | null;
};
type Campaign = {
  id: string;
  name: string;
  objective: string;
  status: string;
  localStatus: string;
  metaStatus: string | null;
  metaReviewReason: string | null;
  budgetType: string;
  dailyBudget: number;
  totalBudget: number | null;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  metricsAvailable: boolean;
  metaCampaignId: string | null;
  lastSyncedAt: string | null;
  lastSyncError: string | null;
  resolvedLocation: string | null;
  locationConfirmedAt: string | null;
  specialAdCategory: string | null;
  placements: string | null;
  adCreative: Creative | null;
  mediaAsset: MediaItem | null;
  _count?: { leads: number };
};

type MetaState = {
  connected: boolean;
  status: string;
  adAccounts: Array<{ id: string; name: string; currency?: string }>;
  pages: Array<{ id: string; name: string }>;
  adAccountId: string | null;
  pageId: string | null;
  accessTokenPreview: string | null;
};

const emptyForm = {
  name: "",
  adCreativeId: "",
  mediaAssetId: "",
  objective: "LEADS",
  budgetType: "DAILY" as "DAILY" | "LIFETIME",
  dailyBudget: 25,
  totalBudget: 500,
  scheduleStart: new Date().toISOString().slice(0, 10),
  scheduleEnd: "",
  city: "Austin",
  radiusKm: 25,
  ageMin: 25,
  ageMax: 45,
  specialAdCategory: "NONE",
  resolvedLocation: "",
  locationConfirmed: false,
  placements: ["feed_square"] as string[],
  adAccountId: "act_100200300",
  pageId: "page_778899",
  previewPlacement: "feed_square",
};

export default function CampaignsPage() {
  const searchParams = useSearchParams();
  const preselected = searchParams.get("creativeId") || "";
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [meta, setMeta] = useState<MetaState | null>(null);
  const [businessLocation, setBusinessLocation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [bradleyNote, setBradleyNote] = useState("");
  const [showForm, setShowForm] = useState(Boolean(preselected));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm, adCreativeId: preselected });

  async function load() {
    const [cRes, aRes, mRes, mediaRes] = await Promise.all([
      fetch("/api/campaigns"),
      fetch("/api/ads"),
      fetch("/api/meta/connect"),
      fetch("/api/media"),
    ]);
    const [cData, aData, mData, mediaData] = await Promise.all([
      cRes.json(),
      aRes.json(),
      mRes.json(),
      mediaRes.json(),
    ]);
    setCampaigns(cData.campaigns || []);
    setCreatives(aData.creatives || []);
    setMedia((mediaData.assets || []).filter((a: MediaItem) => a.mediaType === "image" || a.mediaType === "video"));
    setMeta(mData.connection);
    setBusinessLocation(mData.businessLocation || null);
    setForm((f) => {
      const next = { ...f };
      if (!next.adCreativeId && aData.creatives?.[0]) next.adCreativeId = aData.creatives[0].id;
      if (!next.mediaAssetId && mediaData.assets?.[0]) next.mediaAssetId = mediaData.assets[0].id;
      if (mData.connection?.adAccountId) next.adAccountId = mData.connection.adAccountId;
      if (mData.connection?.pageId) next.pageId = mData.connection.pageId;
      if (!next.resolvedLocation && mData.businessLocation) {
        const geo = resolveLocationCandidate(mData.businessLocation);
        if (geo.ok) next.resolvedLocation = geo.resolvedLocation;
      }
      if (!next.city && mData.businessLocation) {
        next.city = mData.businessLocation.split(",")[0].trim();
      }
      return next;
    });
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedCreative = useMemo(
    () => creatives.find((c) => c.id === form.adCreativeId),
    [creatives, form.adCreativeId]
  );
  const selectedMedia = useMemo(
    () => media.find((m) => m.id === form.mediaAssetId),
    [media, form.mediaAssetId]
  );
  const selectedCampaign = useMemo(
    () => campaigns.find((c) => c.id === selectedId) || null,
    [campaigns, selectedId]
  );
  const metaConnected = meta?.status === "CONNECTED";

  async function connectMeta() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/meta/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "connect" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Meta connect failed");
      setMeta(data.connection);
      setForm((f) => ({
        ...f,
        adAccountId: data.connection.adAccountId || f.adAccountId,
        pageId: data.connection.pageId || f.pageId,
      }));
      setMessage("Meta account connected (mock OAuth). Select Page and ad account, then deploy.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Meta connect failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveAssets() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/meta/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "select_assets",
          adAccountId: form.adAccountId,
          pageId: form.pageId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save Meta assets");
      setMeta(data.connection);
      setMessage("Page and ad account saved for this business.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  function confirmLocation() {
    const geo = resolveLocationCandidate(form.resolvedLocation || businessLocation);
    if (!geo.ok) {
      setError(geo.reason);
      return;
    }
    setForm((f) => ({
      ...f,
      resolvedLocation: geo.resolvedLocation,
      locationConfirmed: true,
      city: geo.resolvedLocation.split(",")[0].trim(),
    }));
    setMessage(geo.message);
    setError("");
  }

  function togglePlacement(id: string) {
    setForm((f) => {
      const has = f.placements.includes(id);
      const placements = has ? f.placements.filter((p) => p !== id) : [...f.placements, id];
      return {
        ...f,
        placements: placements.length ? placements : ["feed_square"],
        previewPlacement: has && f.previewPlacement === id ? placements[0] || "feed_square" : f.previewPlacement,
      };
    });
  }

  async function createCampaign(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    setBradleyNote("");
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name || `${selectedCreative?.headline || "Campaign"}`,
          adCreativeId: form.adCreativeId,
          mediaAssetId: form.mediaAssetId || null,
          objective: form.objective,
          budgetType: form.budgetType,
          dailyBudget: form.dailyBudget,
          totalBudget: form.budgetType === "LIFETIME" ? form.totalBudget : null,
          scheduleStart: form.scheduleStart,
          scheduleEnd: form.budgetType === "LIFETIME" ? form.scheduleEnd || null : null,
          adAccountId: form.adAccountId,
          pageId: form.pageId,
          deploy: true,
          specialAdCategory: form.specialAdCategory,
          resolvedLocation: form.resolvedLocation,
          locationConfirmed: form.locationConfirmed,
          placements: form.placements,
          targeting: {
            countries: ["US"],
            cities: [form.city],
            radiusKm: form.radiusKm,
            ageMin: form.ageMin,
            ageMax: form.ageMax,
            interests: ["Fitness"],
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create campaign");
      setBradleyNote(data.bradley?.notes || "");
      setMessage(data.meta?.message || "Campaign created.");
      setShowForm(false);
      setSelectedId(data.campaign?.id || null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveDraft() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name || `${selectedCreative?.headline || "Campaign"}`,
          adCreativeId: form.adCreativeId,
          mediaAssetId: form.mediaAssetId || null,
          objective: form.objective,
          budgetType: form.budgetType,
          dailyBudget: form.dailyBudget,
          totalBudget: form.budgetType === "LIFETIME" ? form.totalBudget : null,
          scheduleStart: form.scheduleStart,
          scheduleEnd: form.budgetType === "LIFETIME" ? form.scheduleEnd || null : null,
          specialAdCategory: form.specialAdCategory,
          resolvedLocation: form.resolvedLocation,
          locationConfirmed: false,
          placements: form.placements,
          deploy: false,
          targeting: {
            countries: ["US"],
            cities: [form.city],
            radiusKm: form.radiusKm,
            ageMin: form.ageMin,
            ageMax: form.ageMax,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save draft");
      setBradleyNote(data.bradley?.notes || "");
      setMessage("Draft saved. Confirm location and deploy when ready.");
      setShowForm(false);
      setSelectedId(data.campaign?.id || null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function act(id: string, action: string) {
    if (["pause", "activate", "stop"].includes(action)) {
      const label = action === "stop" ? "stop this campaign" : `${action} this campaign`;
      if (!window.confirm(`Confirm and ${label}? Meta must acknowledge before status updates.`)) return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/campaigns", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      if (data.syncError) {
        setMessage(`${data.syncError} Previous metrics kept.`);
      } else {
        setMessage(
          action === "sync"
            ? `Synced: ${data.campaign.metricsAvailable ? formatNumber(data.campaign.impressions) + " impressions" : "metrics unavailable"}`
            : `Campaign ${action}d.`
        );
      }
      await load();
      setSelectedId(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  const previewAspect =
    META_PLACEMENTS.find((p) => p.id === form.previewPlacement)?.aspect || "1 / 1";

  return (
    <div>
      <PageHeader
        title="Campaigns"
        description="Review creatives and media, confirm location, then deploy to Meta. Local status and Meta status stay separate."
        actions={
          <button className="btn-primary" onClick={() => setShowForm((s) => !s)}>
            {showForm ? "Close builder" : "Create campaign"}
          </button>
        }
      />

      <div className="card mb-4 flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <div className="text-sm font-semibold text-teal-950">Meta connection</div>
          <div className="text-xs text-slate-500">
            {metaConnected
              ? `Connected · ${meta?.adAccountId || "no ad account"} · ${meta?.pageId || "no page"}`
              : meta?.status === "RECONNECT_REQUIRED"
                ? "Reconnect required before Meta writes (BR-005)."
                : "Connect Meta, then select Page and ad account."}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!metaConnected ? (
            <button className="btn-primary" disabled={busy} onClick={connectMeta}>
              {busy ? "Connecting..." : "Connect Meta"}
            </button>
          ) : (
            <button className="btn-secondary" disabled={busy} onClick={saveAssets}>
              Save Page / ad account
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</div>
      )}
      {error && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {bradleyNote && (
        <div className="mb-4 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-900">
          <span className="font-semibold">Bradley Filter (internal check): </span>
          {bradleyNote}
        </div>
      )}

      {showForm && (
        <form onSubmit={createCampaign} className="mb-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="card grid gap-4 p-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <h2 className="font-semibold text-teal-950">Campaign review & deploy</h2>
              <p className="text-xs text-slate-500">
                Six Meta objectives, owned media, location confirm, then Confirm and submit to Meta.
              </p>
            </div>

            <div>
              <label className="label">Campaign name</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Austin Lead Gen"
              />
            </div>
            <div>
              <label className="label">Objective</label>
              <select
                className="input"
                value={form.objective}
                onChange={(e) => setForm({ ...form, objective: e.target.value })}
              >
                {META_OBJECTIVES.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Ad creative</label>
              <select
                className="input"
                required
                value={form.adCreativeId}
                onChange={(e) => setForm({ ...form, adCreativeId: e.target.value })}
              >
                {creatives.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.headline}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Media revision</label>
              <select
                className="input"
                required
                value={form.mediaAssetId}
                onChange={(e) => setForm({ ...form, mediaAssetId: e.target.value })}
              >
                <option value="">Select media</option>
                {media.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.filename} ({m.mediaType})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Budget type</label>
              <select
                className="input"
                value={form.budgetType}
                onChange={(e) =>
                  setForm({ ...form, budgetType: e.target.value as "DAILY" | "LIFETIME" })
                }
              >
                <option value="DAILY">Daily</option>
                <option value="LIFETIME">Lifetime</option>
              </select>
            </div>
            <div>
              <label className="label">
                {form.budgetType === "DAILY" ? "Daily budget ($)" : "Lifetime budget ($)"}
              </label>
              <input
                className="input"
                type="number"
                min={1}
                value={form.budgetType === "DAILY" ? form.dailyBudget : form.totalBudget}
                onChange={(e) =>
                  form.budgetType === "DAILY"
                    ? setForm({ ...form, dailyBudget: Number(e.target.value) })
                    : setForm({ ...form, totalBudget: Number(e.target.value) })
                }
              />
            </div>

            <div>
              <label className="label">Schedule start</label>
              <input
                className="input"
                type="date"
                value={form.scheduleStart}
                onChange={(e) => setForm({ ...form, scheduleStart: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Schedule end {form.budgetType === "LIFETIME" ? "(required)" : "(optional)"}</label>
              <input
                className="input"
                type="date"
                value={form.scheduleEnd}
                onChange={(e) => setForm({ ...form, scheduleEnd: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Special ad category</label>
              <select
                className="input"
                value={form.specialAdCategory}
                onChange={(e) => setForm({ ...form, specialAdCategory: e.target.value })}
              >
                {SPECIAL_AD_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Age range</label>
              <div className="flex gap-2">
                <input
                  className="input"
                  type="number"
                  value={form.ageMin}
                  onChange={(e) => setForm({ ...form, ageMin: Number(e.target.value) })}
                />
                <input
                  className="input"
                  type="number"
                  value={form.ageMax}
                  onChange={(e) => setForm({ ...form, ageMax: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="label">Resolved location</label>
              <div className="flex flex-wrap gap-2">
                <input
                  className="input flex-1"
                  value={form.resolvedLocation}
                  onChange={(e) =>
                    setForm({ ...form, resolvedLocation: e.target.value, locationConfirmed: false })
                  }
                  placeholder="City, region"
                />
                <input
                  className="input w-28"
                  type="number"
                  value={form.radiusKm}
                  onChange={(e) => setForm({ ...form, radiusKm: Number(e.target.value) })}
                  title="Radius km"
                />
                <button type="button" className="btn-secondary" onClick={confirmLocation}>
                  {form.locationConfirmed ? "Confirmed" : "Confirm location"}
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {form.locationConfirmed
                  ? "Location confirmed for deploy (FR-030)."
                  : "Confirm the resolved location before submitting to Meta."}
              </p>
            </div>

            <div>
              <label className="label">Ad account</label>
              <select
                className="input"
                value={form.adAccountId}
                onChange={(e) => setForm({ ...form, adAccountId: e.target.value })}
              >
                {(meta?.adAccounts || []).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Facebook Page</label>
              <select
                className="input"
                value={form.pageId}
                onChange={(e) => setForm({ ...form, pageId: e.target.value })}
              >
                {(meta?.pages || []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="label">Placements</label>
              <div className="flex flex-wrap gap-2">
                {META_PLACEMENTS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                      form.placements.includes(p.id)
                        ? "border-teal-600 bg-teal-50 text-teal-900"
                        : "border-[var(--line)] text-slate-600"
                    }`}
                    onClick={() => togglePlacement(p.id)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 md:col-span-2">
              <button
                type="submit"
                className="btn-primary"
                disabled={busy || creatives.length === 0 || !metaConnected}
              >
                {busy ? "Working..." : "Confirm and submit to Meta"}
              </button>
              <button type="button" className="btn-secondary" disabled={busy} onClick={saveDraft}>
                Save draft
              </button>
            </div>
          </div>

          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="font-semibold text-teal-950">Placement preview</h3>
              <select
                className="input w-auto text-xs"
                value={form.previewPlacement}
                onChange={(e) => setForm({ ...form, previewPlacement: e.target.value })}
              >
                {form.placements.map((id) => {
                  const p = META_PLACEMENTS.find((x) => x.id === id);
                  return (
                    <option key={id} value={id}>
                      {p?.label || id}
                    </option>
                  );
                })}
              </select>
            </div>
            <div
              className="mx-auto w-full max-w-[280px] overflow-hidden rounded-xl border border-[var(--line)] bg-slate-100"
              style={{ aspectRatio: previewAspect }}
            >
              {selectedMedia?.mediaType === "video" ? (
                <video src={selectedMedia.url} className="h-full w-full object-cover" muted controls />
              ) : selectedMedia ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selectedMedia.url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-500">
                  Select media
                </div>
              )}
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="font-semibold text-slate-900">
                {selectedCreative?.headline || "Headline"}
              </div>
              <p className="line-clamp-4 text-slate-600">
                {selectedCreative?.primaryText || "Primary text appears here."}
              </p>
              <div className="inline-flex rounded-md bg-teal-700 px-3 py-1 text-xs font-semibold text-white">
                {selectedCreative?.cta || "Learn More"}
              </div>
              <p className="text-xs text-slate-500">
                Compliance score: {selectedCreative?.complianceScore ?? "—"} · Bradley Filter is an
                internal check, not Meta approval.
              </p>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-sm text-slate-500">Loading campaigns...</div>
      ) : campaigns.length === 0 ? (
        <EmptyState
          title="No campaigns yet"
          description="Generate an ad and prepare media, then create a campaign from this screen."
          action={
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              Create campaign
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <div className="card overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[var(--line)] bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Campaign</th>
                  <th className="px-4 py-3">Local / Meta</th>
                  <th className="px-4 py-3">Budget</th>
                  <th className="px-4 py-3">Perf</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {campaigns.map((c) => (
                  <tr
                    key={c.id}
                    className={selectedId === c.id ? "bg-teal-50/40" : undefined}
                    onClick={() => setSelectedId(c.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{c.name}</div>
                      <div className="text-xs text-slate-500">
                        {c.objective} · {c.metaCampaignId || "local draft"} · {c._count?.leads || 0}{" "}
                        leads
                      </div>
                      {c.lastSyncedAt && (
                        <div className="text-[11px] text-slate-400">
                          Synced {new Date(c.lastSyncedAt).toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <StatusBadge status={c.localStatus || c.status} />
                        <StatusBadge status={c.metaStatus || "—"} />
                      </div>
                      {c.metaReviewReason && (
                        <div className="mt-1 text-[11px] text-amber-700">{c.metaReviewReason}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {c.budgetType === "LIFETIME"
                        ? `${formatCurrency(c.totalBudget || 0)} lifetime`
                        : `$${c.dailyBudget}/day`}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {c.metricsAvailable ? (
                        <>
                          {formatNumber(c.impressions)} impr
                          <br />
                          {formatNumber(c.clicks)} clicks · {c.conversions} conv
                          <br />
                          {formatCurrency(c.spend)} spent
                        </>
                      ) : (
                        <span className="text-slate-400">Metrics unavailable</span>
                      )}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-wrap gap-1">
                        {c.status !== "ACTIVE" && c.metaCampaignId && (
                          <button
                            className="btn-secondary px-2 py-1 text-xs"
                            disabled={busy}
                            onClick={() => act(c.id, "activate")}
                          >
                            Activate
                          </button>
                        )}
                        {c.status === "ACTIVE" && (
                          <button
                            className="btn-secondary px-2 py-1 text-xs"
                            disabled={busy}
                            onClick={() => act(c.id, "pause")}
                          >
                            Pause
                          </button>
                        )}
                        <button
                          className="btn-secondary px-2 py-1 text-xs"
                          disabled={busy}
                          onClick={() => act(c.id, "sync")}
                        >
                          Sync
                        </button>
                        <button
                          className="btn-ghost px-2 py-1 text-xs text-red-700"
                          disabled={busy || !c.metaCampaignId}
                          onClick={() => act(c.id, "stop")}
                        >
                          Stop
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-teal-950">Campaign detail & metrics</h3>
            {!selectedCampaign ? (
              <p className="mt-3 text-sm text-slate-500">Select a campaign to inspect metrics.</p>
            ) : (
              <div className="mt-4 space-y-4 text-sm">
                <div>
                  <div className="text-lg font-semibold text-slate-900">{selectedCampaign.name}</div>
                  <div className="text-xs text-slate-500">
                    Local: {selectedCampaign.localStatus} · Meta:{" "}
                    {selectedCampaign.metaStatus || "not submitted"}
                  </div>
                </div>
                {selectedCampaign.mediaAsset && (
                  <div className="overflow-hidden rounded-lg border border-[var(--line)]">
                    {selectedCampaign.mediaAsset.mediaType === "video" ? (
                      <video
                        src={selectedCampaign.mediaAsset.url}
                        className="aspect-video w-full object-cover"
                        muted
                        controls
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedCampaign.mediaAsset.url}
                        alt=""
                        className="aspect-square w-full object-cover"
                      />
                    )}
                  </div>
                )}
                <dl className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <dt className="text-xs text-slate-500">Impressions</dt>
                    <dd className="font-semibold">
                      {selectedCampaign.metricsAvailable
                        ? formatNumber(selectedCampaign.impressions)
                        : "Unavailable"}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <dt className="text-xs text-slate-500">Clicks</dt>
                    <dd className="font-semibold">
                      {selectedCampaign.metricsAvailable
                        ? formatNumber(selectedCampaign.clicks)
                        : "Unavailable"}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <dt className="text-xs text-slate-500">Conversions</dt>
                    <dd className="font-semibold">
                      {selectedCampaign.metricsAvailable
                        ? selectedCampaign.conversions
                        : "Unavailable"}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <dt className="text-xs text-slate-500">Spend</dt>
                    <dd className="font-semibold">
                      {selectedCampaign.metricsAvailable
                        ? formatCurrency(selectedCampaign.spend)
                        : "Unavailable"}
                    </dd>
                  </div>
                </dl>
                {selectedCampaign.lastSyncError && (
                  <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    {selectedCampaign.lastSyncError}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    className="btn-secondary"
                    disabled={busy}
                    onClick={() => act(selectedCampaign.id, "sync")}
                  >
                    Sync metrics
                  </button>
                  {selectedCampaign.status === "ACTIVE" ? (
                    <button
                      className="btn-secondary"
                      disabled={busy}
                      onClick={() => act(selectedCampaign.id, "pause")}
                    >
                      Pause
                    </button>
                  ) : (
                    <button
                      className="btn-secondary"
                      disabled={busy || !selectedCampaign.metaCampaignId}
                      onClick={() => act(selectedCampaign.id, "activate")}
                    >
                      Activate
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Unavailable values are shown as unavailable, not zero (FR-034). Failed sync keeps
                  the last good snapshot (FR-035).
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
