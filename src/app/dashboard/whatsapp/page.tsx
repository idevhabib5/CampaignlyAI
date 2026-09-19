"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { parseJson } from "@/lib/utils";

type Message = {
  id: string;
  direction: string;
  sender: string;
  content: string;
  createdAt: string;
};

type ScoringBreakdown = {
  intentLabel?: string;
  sentimentScore?: number;
  behavioralSignals?: Array<{ id: string; label: string; weight: number }>;
  scoringBreakdown?: {
    intentContribution: number;
    sentimentContribution: number;
    signalContribution: number;
    previousScore: number;
  };
  leadScoreDelta?: number;
  followUpDelayHours?: number;
  escalateToOwner?: boolean;
};

type Conversation = {
  id: string;
  status: string;
  leadScore: number;
  sentiment: string;
  intent: string;
  intentConfidence: number;
  scoringBreakdown: string | null;
  readyForConversion: boolean;
  escalateToOwner: boolean;
  followUpDelayHours: number;
  lead: { id: string; name: string; phone: string | null; status: string };
  messages: Message[];
};

type LastScored = {
  intentLabel: string;
  intent: string;
  intentConfidence: number;
  sentiment: string;
  sentimentScore: number;
  leadScore: number;
  leadScoreDelta: number;
  readyForConversion: boolean;
  escalateToOwner: boolean;
  followUpDelayHours: number;
  behavioralSignals: Array<{ id: string; label: string; weight: number }>;
  scoringBreakdown: {
    intentContribution: number;
    sentimentContribution: number;
    signalContribution: number;
    previousScore: number;
  };
};

const INTENT_PRESETS = [
  { label: "Book intent", content: "Yes I'm interested, can I book a call today?" },
  { label: "Pricing", content: "What's the price for a starter package?" },
  { label: "Schedule", content: "When are you available this week?" },
  { label: "Hesitant", content: "Still thinking about it, maybe later." },
  { label: "Info", content: "Tell me more about what you offer." },
  { label: "Opt out", content: "Please stop messaging me, not interested." },
];

export default function WhatsAppPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [ownerMsg, setOwnerMsg] = useState("");
  const [notice, setNotice] = useState("");
  const [lastScored, setLastScored] = useState<LastScored | null>(null);

  async function load() {
    const res = await fetch("/api/whatsapp");
    const data = await res.json();
    setConversations(data.conversations || []);
    if (!activeId && data.conversations?.[0]) setActiveId(data.conversations[0].id);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const active = conversations.find((c) => c.id === activeId) || null;

  const persistedScoring = useMemo(() => {
    if (!active?.scoringBreakdown) return null;
    return parseJson<ScoringBreakdown>(active.scoringBreakdown, {});
  }, [active]);

  async function action(payload: Record<string, string>) {
    if (!active) return;
    setBusy(true);
    setNotice("");
    const res = await fetch("/api/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: active.id, ...payload }),
    });
    const data = await res.json();
    if (data.scored) {
      setLastScored({
        intentLabel: data.scored.intentLabel,
        intent: data.scored.intent,
        intentConfidence: data.scored.intentConfidence,
        sentiment: data.scored.sentiment,
        sentimentScore: data.scored.sentimentScore,
        leadScore: data.scored.leadScore,
        leadScoreDelta: data.scored.leadScoreDelta,
        readyForConversion: data.scored.readyForConversion,
        escalateToOwner: data.scored.escalateToOwner,
        followUpDelayHours: data.scored.followUpDelayHours,
        behavioralSignals: data.scored.behavioralSignals || [],
        scoringBreakdown: data.scored.scoringBreakdown,
      });
      if (data.scored.readyForConversion) {
        setNotice("Conversion-ready — owner notification created (intent + score threshold met).");
      } else if (data.scored.intent === "rejection") {
        setNotice("Rejection detected — follow-ups stopped and lead marked lost.");
      }
    }
    setBusy(false);
    await load();
  }

  async function runFollowups() {
    setBusy(true);
    setNotice("");
    const res = await fetch("/api/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "run_followups" }),
    });
    const data = await res.json();
    setNotice(data.message || `Processed ${data.processed || 0} follow-ups.`);
    if (data.conversations) setConversations(data.conversations);
    setBusy(false);
  }

  async function sendOwner(e: FormEvent) {
    e.preventDefault();
    if (!ownerMsg.trim()) return;
    await action({ action: "send_owner", content: ownerMsg });
    setOwnerMsg("");
  }

  const displayIntent = lastScored?.intentLabel || persistedScoring?.intentLabel || active?.intent;
  const displaySignals =
    lastScored?.behavioralSignals || persistedScoring?.behavioralSignals || [];
  const displayBreakdown = lastScored?.scoringBreakdown || persistedScoring?.scoringBreakdown;

  return (
    <div>
      <PageHeader
        title="WhatsApp AI Agent"
        description="Scores each reply with intent + sentiment + behavioral signals, then escalates when conversion-ready."
        actions={
          <button className="btn-secondary" disabled={busy || loading} onClick={runFollowups}>
            {busy ? "Running jobs..." : "Run follow-up jobs"}
          </button>
        }
      />
      <div className="mb-4 rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-900">
        Demo: <span className="font-semibold">Run follow-up jobs</span> simulates a BullMQ tick that
        sends overdue AI/owner follow-ups based on each conversation&apos;s{" "}
        <code className="text-xs">followUpDelayHours</code>.
      </div>
      {notice && (
        <div className="mb-4 rounded-lg bg-orange-50 px-3 py-2 text-sm text-orange-800">{notice}</div>
      )}

      {loading ? (
        <div className="text-sm text-slate-500">Loading conversations...</div>
      ) : conversations.length === 0 ? (
        <EmptyState
          title="No conversations yet"
          description="Sync a Meta lead to start an AI WhatsApp outreach thread."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-3">
          <div className="card overflow-hidden xl:col-span-1">
            <div className="border-b border-[var(--line)] px-4 py-3 font-semibold">Inbox</div>
            <div className="max-h-[70vh] divide-y divide-[var(--line)] overflow-y-auto">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveId(c.id);
                    setLastScored(null);
                  }}
                  className={`flex w-full flex-col items-start px-4 py-3 text-left hover:bg-teal-50/60 ${
                    activeId === c.id ? "bg-teal-50" : ""
                  }`}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="font-medium text-slate-900">{c.lead.name}</span>
                    <span className="text-xs font-semibold text-teal-700">{c.leadScore}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <StatusBadge status={c.status} />
                    {c.intent && c.intent !== "unknown" && (
                      <span className="badge bg-slate-100 text-slate-700">{c.intent.replaceAll("_", " ")}</span>
                    )}
                    {c.readyForConversion && <StatusBadge status="CONVERSION_READY" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex min-h-[520px] flex-col gap-4 xl:col-span-2">
            <div className="card flex min-h-[420px] flex-1 flex-col">
              {!active ? (
                <div className="grid flex-1 place-items-center text-sm text-slate-500">
                  Select a conversation
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] px-4 py-3">
                    <div>
                      <div className="font-semibold text-teal-950">{active.lead.name}</div>
                      <div className="text-xs text-slate-500">
                        {active.lead.phone || "No phone"} · score {active.leadScore} ·{" "}
                        {active.sentiment}
                        {active.intentConfidence > 0 ? ` · intent ${active.intentConfidence}%` : ""}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {active.status === "AI_ACTIVE" ? (
                        <button
                          className="btn-secondary"
                          disabled={busy}
                          onClick={() => action({ action: "takeover" })}
                        >
                          Manual takeover
                        </button>
                      ) : (
                        <button
                          className="btn-secondary"
                          disabled={busy || active.status === "CLOSED"}
                          onClick={() => action({ action: "release_to_ai" })}
                        >
                          Release to AI
                        </button>
                      )}
                      <button
                        className="btn-primary"
                        disabled={busy || active.status === "CLOSED"}
                        onClick={() => action({ action: "simulate_reply" })}
                      >
                        Simulate lead reply
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 border-b border-[var(--line)] px-4 py-2">
                    {INTENT_PRESETS.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        disabled={busy || active.status === "CLOSED"}
                        className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-teal-50"
                        onClick={() => action({ action: "simulate_reply", content: p.content })}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
                    {active.messages.map((m) => (
                      <div
                        key={m.id}
                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                          m.direction === "outbound"
                            ? "ml-auto bg-teal-700 text-white"
                            : "bg-white text-slate-800 shadow-sm"
                        }`}
                      >
                        <div className="mb-1 text-[10px] uppercase opacity-70">{m.sender}</div>
                        {m.content}
                      </div>
                    ))}
                  </div>

                  <form onSubmit={sendOwner} className="flex gap-2 border-t border-[var(--line)] p-3">
                    <input
                      className="input"
                      placeholder={
                        active.status === "MANUAL"
                          ? "Send owner message..."
                          : "Take over to type, or use intent presets above"
                      }
                      value={ownerMsg}
                      onChange={(e) => setOwnerMsg(e.target.value)}
                      disabled={active.status === "CLOSED"}
                    />
                    <button
                      className="btn-primary"
                      disabled={busy || !ownerMsg.trim() || active.status === "CLOSED"}
                    >
                      Send
                    </button>
                  </form>
                </>
              )}
            </div>

            {active && (
              <div className="card p-4">
                <div className="font-semibold text-teal-950">Intent & sentiment score</div>
                <p className="mt-1 text-xs text-slate-500">
                  Scope FE-3: score using sentiment and intent. FE-4: follow-up timing & escalation.
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg bg-teal-50 p-3">
                    <div className="text-[11px] uppercase text-teal-700">Lead score</div>
                    <div className="font-display text-2xl font-semibold text-teal-950">
                      {lastScored?.leadScore ?? active.leadScore}
                      {lastScored && (
                        <span className="ml-2 text-sm font-sans font-medium text-teal-700">
                          ({lastScored.leadScoreDelta >= 0 ? "+" : ""}
                          {lastScored.leadScoreDelta})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <div className="text-[11px] uppercase text-slate-500">Intent</div>
                    <div className="text-sm font-semibold text-slate-900">
                      {(displayIntent || "unknown").toString().replaceAll("_", " ")}
                    </div>
                    <div className="text-xs text-slate-500">
                      confidence {lastScored?.intentConfidence ?? active.intentConfidence}%
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <div className="text-[11px] uppercase text-slate-500">Sentiment</div>
                    <div className="text-sm font-semibold capitalize text-slate-900">
                      {lastScored?.sentiment ?? active.sentiment}
                    </div>
                    <div className="text-xs text-slate-500">
                      score{" "}
                      {lastScored?.sentimentScore ??
                        persistedScoring?.sentimentScore ??
                        "—"}
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <div className="text-[11px] uppercase text-slate-500">Next follow-up</div>
                    <div className="text-sm font-semibold text-slate-900">
                      {(lastScored?.followUpDelayHours ?? active.followUpDelayHours) === 0
                        ? "Escalate / stop now"
                        : `${lastScored?.followUpDelayHours ?? active.followUpDelayHours}h`}
                    </div>
                    {(lastScored?.escalateToOwner ?? active.escalateToOwner) && (
                      <div className="text-xs font-medium text-orange-700">Escalate to owner</div>
                    )}
                  </div>
                </div>

                {displayBreakdown && (
                  <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
                    <div>
                      Intent contribution:{" "}
                      <span className="font-semibold">{displayBreakdown.intentContribution}</span>
                    </div>
                    <div>
                      Sentiment contribution:{" "}
                      <span className="font-semibold">{displayBreakdown.sentimentContribution}</span>
                    </div>
                    <div>
                      Behavioral signals:{" "}
                      <span className="font-semibold">{displayBreakdown.signalContribution}</span>
                    </div>
                  </div>
                )}

                {displaySignals.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs font-semibold uppercase text-slate-500">
                      Behavioral signals
                    </div>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {displaySignals.map((s) => (
                        <li
                          key={s.id}
                          className={`badge ${
                            s.weight >= 0 ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"
                          }`}
                        >
                          {s.label} ({s.weight >= 0 ? "+" : ""}
                          {s.weight})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
