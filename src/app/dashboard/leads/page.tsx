"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";

type ActivityMsg = {
  id: string;
  direction: string;
  sender: string;
  content: string;
  createdAt: string;
};

type Lead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  score: number;
  category: string | null;
  engagementLevel: string;
  notes: string | null;
  lastActivityAt?: string;
  campaign: { id: string; name: string } | null;
  conversation: {
    id: string;
    leadScore: number;
    readyForConversion: boolean;
    messages?: ActivityMsg[];
  } | null;
};

type Analytics = {
  total: number;
  byStatus: Record<string, number>;
  campaigns: Array<{
    campaignId: string;
    name: string;
    total: number;
    converted: number;
    ready: number;
    conversionRate: number;
  }>;
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<Lead | null>(null);

  async function load(params?: { q?: string; status?: string }) {
    setLoading(true);
    const sp = new URLSearchParams();
    if (params?.q ?? q) sp.set("q", params?.q ?? q);
    if (params?.status ?? status) sp.set("status", params?.status ?? status);
    const res = await fetch(`/api/leads?${sp.toString()}`);
    const data = await res.json();
    setLeads(data.leads || []);
    setAnalytics(data.analytics || null);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function syncLeads() {
    setBusy(true);
    setMessage("");
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sync" }),
    });
    const data = await res.json();
    setMessage(data.message || "Synced");
    setBusy(false);
    await load();
  }

  async function updateLead(id: string, patch: Record<string, string>) {
    setBusy(true);
    await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    setBusy(false);
    await load();
    if (selected?.id === id) {
      const updated = (await (await fetch("/api/leads")).json()).leads.find((l: Lead) => l.id === id);
      setSelected(updated || null);
    }
  }

  const activity = useMemo(() => {
    if (!selected?.conversation?.messages) return [];
    return [...selected.conversation.messages].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [selected]);

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Sync Meta lead forms, track conversion by campaign, and review activity timelines."
        actions={
          <button className="btn-primary" disabled={busy} onClick={syncLeads}>
            {busy ? "Syncing..." : "Refresh from Meta"}
          </button>
        }
      />
      {message && (
        <div className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </div>
      )}

      {analytics && (
        <div className="mb-6 grid gap-4 lg:grid-cols-3">
          <div className="card p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Pipeline
            </div>
            <div className="mt-2 text-2xl font-semibold text-teal-950">{analytics.total}</div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
              {Object.entries(analytics.byStatus)
                .slice(0, 5)
                .map(([s, n]) => (
                  <span key={s} className="rounded-full bg-slate-100 px-2 py-0.5">
                    {s.replaceAll("_", " ")}: {n}
                  </span>
                ))}
            </div>
          </div>
          <div className="card overflow-hidden p-0 lg:col-span-2">
            <div className="border-b border-[var(--line)] px-4 py-3 text-sm font-semibold text-teal-950">
              Campaign conversion
            </div>
            <div className="divide-y divide-[var(--line)]">
              {analytics.campaigns.length === 0 ? (
                <div className="px-4 py-6 text-sm text-slate-500">No campaign attribution yet.</div>
              ) : (
                analytics.campaigns.map((c) => (
                  <div
                    key={c.campaignId}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <div>
                      <div className="font-medium text-slate-900">{c.name}</div>
                      <div className="text-xs text-slate-500">
                        {c.total} leads · {c.ready} ready · {c.converted} converted
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-teal-800">{c.conversionRate}%</div>
                      <div className="text-xs text-slate-500">conversion</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          className="input"
          placeholder="Search name, email, phone..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load({ q })}
        />
        <select
          className="input sm:w-48"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            load({ status: e.target.value });
          }}
        >
          <option value="">All statuses</option>
          {[
            "NEW",
            "CONTACTED",
            "NURTURING",
            "QUALIFIED",
            "CONVERSION_READY",
            "CONVERTED",
            "LOST",
          ].map((s) => (
            <option key={s} value={s}>
              {s.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <button className="btn-secondary" onClick={() => load()}>
          Search
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card overflow-hidden lg:col-span-2">
          {loading ? (
            <div className="p-6 text-sm text-slate-500">Loading leads...</div>
          ) : leads.length === 0 ? (
            <EmptyState
              title="No leads found"
              description="Deploy a campaign or sync mock Meta lead forms to populate this inbox."
            />
          ) : (
            <div className="divide-y divide-[var(--line)]">
              {leads.map((lead) => (
                <button
                  key={lead.id}
                  className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-teal-50/50"
                  onClick={() => setSelected(lead)}
                >
                  <div>
                    <div className="font-medium text-slate-900">{lead.name}</div>
                    <div className="text-xs text-slate-500">
                      {lead.email || "No email"} · {lead.phone || "No phone"}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {lead.campaign?.name || "Unassigned"} · score {lead.score}
                    </div>
                  </div>
                  <StatusBadge status={lead.status} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-teal-950">Lead details</h2>
          {!selected ? (
            <p className="mt-3 text-sm text-slate-500">Select a lead to view details and activity.</p>
          ) : (
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <div className="text-xs text-slate-500">Name</div>
                <div className="font-medium">{selected.name}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Contact</div>
                <div>{selected.email}</div>
                <div>{selected.phone}</div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={selected.status} />
                <span className="text-xs text-slate-500">
                  {selected.engagementLevel} engagement · {selected.category}
                </span>
              </div>
              <div>
                <label className="label">Update status</label>
                <select
                  className="input"
                  value={selected.status}
                  onChange={(e) => updateLead(selected.id, { status: e.target.value })}
                >
                  {[
                    "NEW",
                    "CONTACTED",
                    "NURTURING",
                    "QUALIFIED",
                    "CONVERSION_READY",
                    "CONVERTED",
                    "LOST",
                  ].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea
                  className="input min-h-[80px]"
                  defaultValue={selected.notes || ""}
                  onBlur={(e) => updateLead(selected.id, { notes: e.target.value })}
                />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Activity timeline
                </div>
                {activity.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-500">No WhatsApp activity yet.</p>
                ) : (
                  <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto">
                    {activity.map((m) => (
                      <li key={m.id} className="rounded-lg bg-slate-50 px-3 py-2 text-xs">
                        <div className="flex justify-between gap-2 text-slate-500">
                          <span>
                            {m.sender} · {m.direction}
                          </span>
                          <span>{new Date(m.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="mt-1 text-slate-800">{m.content}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {selected.conversation && (
                <Link href="/dashboard/whatsapp" className="btn-primary w-full">
                  Open WhatsApp conversation
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
