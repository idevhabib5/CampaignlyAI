"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";

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
  campaign: { id: string; name: string } | null;
  conversation: { id: string; leadScore: number; readyForConversion: boolean } | null;
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
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

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Sync Meta lead forms, search/filter prospects, and track engagement."
        actions={
          <button className="btn-primary" disabled={busy} onClick={syncLeads}>
            {busy ? "Syncing..." : "Refresh from Meta"}
          </button>
        }
      />

      {message && <div className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</div>}

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
          {["NEW", "CONTACTED", "NURTURING", "QUALIFIED", "CONVERSION_READY", "CONVERTED", "LOST"].map(
            (s) => (
              <option key={s} value={s}>
                {s.replaceAll("_", " ")}
              </option>
            )
          )}
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
            <p className="mt-3 text-sm text-slate-500">Select a lead to view details.</p>
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
                  {["NEW", "CONTACTED", "NURTURING", "QUALIFIED", "CONVERSION_READY", "CONVERTED", "LOST"].map(
                    (s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    )
                  )}
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
