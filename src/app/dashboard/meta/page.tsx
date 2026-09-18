"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui";

export default function MetaConnectPage() {
  const [connection, setConnection] = useState<{
    connected: boolean;
    adAccounts: Array<{ id: string; name: string; currency: string }>;
    pages: Array<{ id: string; name: string }>;
    accessTokenPreview: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/meta/connect")
      .then((r) => r.json())
      .then((d) => setConnection(d.connection));
  }, []);

  async function connect() {
    setBusy(true);
    const res = await fetch("/api/meta/connect", { method: "POST" });
    const data = await res.json();
    setConnection(data.connection);
    setMessage("Meta OAuth completed (mock). Tokens expire periodically (LI-5).");
    setBusy(false);
  }

  return (
    <div>
      <PageHeader
        title="Meta account connection"
        description="Secure OAuth connection to Facebook Pages and Ad Accounts (mocked Graph API)."
      />
      {message && <div className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</div>}

      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-semibold text-teal-950">Connection status</div>
            <div className="text-sm text-slate-600">
              {connection?.connected ? "Connected (mock)" : "Not connected"}
            </div>
            {connection?.accessTokenPreview && (
              <div className="mt-1 text-xs text-slate-500">Token: {connection.accessTokenPreview}</div>
            )}
          </div>
          <button className="btn-primary" disabled={busy} onClick={connect}>
            {busy ? "Connecting..." : "Connect with Meta"}
          </button>
        </div>

        {connection && (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm font-semibold">Ad accounts</div>
              <ul className="mt-2 space-y-2 text-sm text-slate-600">
                {connection.adAccounts.map((a) => (
                  <li key={a.id} className="rounded-lg border border-[var(--line)] px-3 py-2">
                    {a.name} · {a.id} · {a.currency}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-sm font-semibold">Pages</div>
              <ul className="mt-2 space-y-2 text-sm text-slate-600">
                {connection.pages.map((p) => (
                  <li key={p.id} className="rounded-lg border border-[var(--line)] px-3 py-2">
                    {p.name} · {p.id}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
