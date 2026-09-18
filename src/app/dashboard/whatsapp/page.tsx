"use client";

import { FormEvent, useEffect, useState } from "react";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";

type Message = {
  id: string;
  direction: string;
  sender: string;
  content: string;
  createdAt: string;
};

type Conversation = {
  id: string;
  status: string;
  leadScore: number;
  sentiment: string;
  readyForConversion: boolean;
  lead: { id: string; name: string; phone: string | null; status: string };
  messages: Message[];
};

export default function WhatsAppPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [ownerMsg, setOwnerMsg] = useState("");
  const [notice, setNotice] = useState("");

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
    if (data.scored?.readyForConversion) {
      setNotice("Lead marked conversion-ready — owner notification created.");
    }
    setBusy(false);
    await load();
  }

  async function sendOwner(e: FormEvent) {
    e.preventDefault();
    if (!ownerMsg.trim()) return;
    await action({ action: "send_owner", content: ownerMsg });
    setOwnerMsg("");
  }

  return (
    <div>
      <PageHeader
        title="WhatsApp AI Agent"
        description="Autonomous nurturing, lead scoring, and manual takeover when prospects are hot."
      />
      {notice && <div className="mb-4 rounded-lg bg-orange-50 px-3 py-2 text-sm text-orange-800">{notice}</div>}

      {loading ? (
        <div className="text-sm text-slate-500">Loading conversations...</div>
      ) : conversations.length === 0 ? (
        <EmptyState
          title="No conversations yet"
          description="Sync a Meta lead to start an AI WhatsApp outreach thread."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="card overflow-hidden lg:col-span-1">
            <div className="border-b border-[var(--line)] px-4 py-3 font-semibold">Inbox</div>
            <div className="max-h-[70vh] divide-y divide-[var(--line)] overflow-y-auto">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
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
                    {c.readyForConversion && <StatusBadge status="CONVERSION_READY" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="card flex min-h-[520px] flex-col lg:col-span-2">
            {!active ? (
              <div className="grid flex-1 place-items-center text-sm text-slate-500">Select a conversation</div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] px-4 py-3">
                  <div>
                    <div className="font-semibold text-teal-950">{active.lead.name}</div>
                    <div className="text-xs text-slate-500">
                      {active.lead.phone || "No phone"} · sentiment {active.sentiment} · score{" "}
                      {active.leadScore}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {active.status === "AI_ACTIVE" ? (
                      <button className="btn-secondary" disabled={busy} onClick={() => action({ action: "takeover" })}>
                        Manual takeover
                      </button>
                    ) : (
                      <button
                        className="btn-secondary"
                        disabled={busy}
                        onClick={() => action({ action: "release_to_ai" })}
                      >
                        Release to AI
                      </button>
                    )}
                    <button
                      className="btn-primary"
                      disabled={busy}
                      onClick={() => action({ action: "simulate_reply" })}
                    >
                      Simulate lead reply
                    </button>
                  </div>
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
                        : "Take over to type, or simulate a lead reply"
                    }
                    value={ownerMsg}
                    onChange={(e) => setOwnerMsg(e.target.value)}
                  />
                  <button className="btn-primary" disabled={busy || !ownerMsg.trim()}>
                    Send
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
