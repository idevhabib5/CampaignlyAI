"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { formatCurrency, formatNumber } from "@/lib/utils";

type Creative = { id: string; headline: string };
type Campaign = {
  id: string;
  name: string;
  status: string;
  dailyBudget: number;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  metaCampaignId: string | null;
  lastSyncedAt: string | null;
  adCreative: Creative | null;
  _count?: { leads: number };
};

export default function CampaignsPage() {
  const searchParams = useSearchParams();
  const preselected = searchParams.get("creativeId") || "";
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [meta, setMeta] = useState<{
    connected: boolean;
    adAccounts: Array<{ id: string; name: string }>;
    pages: Array<{ id: string; name: string }>;
  } | null>(null);
  const [metaConnected, setMetaConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(Boolean(preselected));
  const [form, setForm] = useState({
    name: "",
    adCreativeId: preselected,
    dailyBudget: 25,
    city: "Austin",
    radiusKm: 25,
    ageMin: 25,
    ageMax: 45,
    adAccountId: "act_100200300",
    pageId: "page_778899",
    deploy: true,
  });

  async function load() {
    const [cRes, aRes, mRes] = await Promise.all([
      fetch("/api/campaigns"),
      fetch("/api/ads"),
      fetch("/api/meta/connect"),
    ]);
    const [cData, aData, mData] = await Promise.all([cRes.json(), aRes.json(), mRes.json()]);
    setCampaigns(cData.campaigns || []);
    setCreatives(
      (aData.creatives || []).map((c: Creative & { headline: string }) => ({
        id: c.id,
        headline: c.headline,
      }))
    );
    setMeta(mData.connection);
    setMetaConnected(Boolean(mData.connection?.connected));
    if (!form.adCreativeId && aData.creatives?.[0]) {
      setForm((f) => ({ ...f, adCreativeId: aData.creatives[0].id }));
    }
    setLoading(false);
  }

  async function connectMeta() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/meta/connect", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Meta connect failed");
      setMeta(data.connection);
      setMetaConnected(true);
      setMessage("Meta account connected (mock OAuth). You can deploy campaigns now.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Meta connect failed");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedCreative = useMemo(
    () => creatives.find((c) => c.id === form.adCreativeId),
    [creatives, form.adCreativeId]
  );

  async function createCampaign(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name || `${selectedCreative?.headline || "Campaign"}`,
          adCreativeId: form.adCreativeId,
          dailyBudget: form.dailyBudget,
          adAccountId: form.adAccountId,
          pageId: form.pageId,
          deploy: form.deploy,
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
      setMessage(data.meta?.message || "Campaign created.");
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function act(id: string, action: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      setMessage(
        action === "sync"
          ? `Synced: ${formatNumber(data.campaign.impressions)} impressions`
          : `Campaign ${action}d.`
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Campaigns"
        description="Connect Meta (mock), then create, deploy, pause, and sync lead-generation campaigns."
        actions={
          <button className="btn-primary" onClick={() => setShowForm((s) => !s)}>
            {showForm ? "Close form" : "Create campaign"}
          </button>
        }
      />

      <div className="card mb-4 flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <div className="text-sm font-semibold text-teal-950">Meta connection</div>
          <div className="text-xs text-slate-500">
            {metaConnected
              ? "Connected (mock) — ad accounts and pages ready for deploy."
              : "Connect once, then deploy from this screen. No separate Meta page in the MVP."}
          </div>
        </div>
        <button className="btn-secondary" disabled={busy || metaConnected} onClick={connectMeta}>
          {metaConnected ? "Connected" : busy ? "Connecting..." : "Connect Meta"}
        </button>
      </div>
      {message && (
        <div className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</div>
      )}
      {error && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {showForm && (
        <form onSubmit={createCampaign} className="card mb-6 grid gap-4 p-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <h2 className="font-semibold text-teal-950">Deploy Meta campaign</h2>
            <p className="text-xs text-slate-500">Uses mock Meta Graph API OAuth + deployment.</p>
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
            <label className="label">Daily budget ($)</label>
            <input
              className="input"
              type="number"
              min={1}
              value={form.dailyBudget}
              onChange={(e) => setForm({ ...form, dailyBudget: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="label">City / radius (km)</label>
            <div className="flex gap-2">
              <input
                className="input"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
              <input
                className="input w-28"
                type="number"
                value={form.radiusKm}
                onChange={(e) => setForm({ ...form, radiusKm: Number(e.target.value) })}
              />
            </div>
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
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={form.deploy}
              onChange={(e) => setForm({ ...form, deploy: e.target.checked })}
            />
            Deploy immediately via Meta API (mock)
          </label>
          <div className="md:col-span-2">
            <button className="btn-primary" disabled={busy || creatives.length === 0}>
              {busy ? "Working..." : form.deploy ? "Create & deploy" : "Save draft"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-sm text-slate-500">Loading campaigns...</div>
      ) : campaigns.length === 0 ? (
        <EmptyState
          title="No campaigns yet"
          description="Generate an ad creative first, then deploy it to Meta from this screen."
          action={
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              Create campaign
            </button>
          }
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--line)] bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Campaign</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Budget</th>
                <th className="px-4 py-3">Perf</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {campaigns.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{c.name}</div>
                    <div className="text-xs text-slate-500">
                      {c.metaCampaignId || "local draft"} · {c._count?.leads || 0} leads
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3">${c.dailyBudget}/day</td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {formatNumber(c.impressions)} impr
                    <br />
                    {formatNumber(c.clicks)} clicks · {c.conversions} conv
                    <br />
                    {formatCurrency(c.spend)} spent
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {c.status !== "ACTIVE" && (
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
                        className="btn-secondary px-2 py-1 text-xs"
                        disabled={busy}
                        onClick={() => act(c.id, "duplicate")}
                      >
                        Duplicate
                      </button>
                      <button
                        className="btn-ghost px-2 py-1 text-xs text-red-700"
                        disabled={busy}
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
      )}
    </div>
  );
}
