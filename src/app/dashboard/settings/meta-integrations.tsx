"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui";

type Connection = {
  connected: boolean;
  status: string;
  adAccountId: string | null;
  pageId: string | null;
  accessTokenPreview: string | null;
};

export function MetaIntegrationsCard() {
  const [connection, setConnection] = useState<Connection | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function refresh() {
    const res = await fetch("/api/meta/connect");
    const data = await res.json();
    setConnection(data.connection);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function run(action: "connect" | "reconnect" | "disconnect") {
    if (action === "disconnect") {
      const ok = window.confirm(
        "Disconnect Meta? Existing ads may continue running in Meta Ads Manager until you stop them there."
      );
      if (!ok) return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/meta/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      setConnection(data.connection);
      setMessage(
        action === "disconnect"
          ? data.message || "Meta disconnected."
          : action === "reconnect"
            ? "Meta reconnected."
            : "Meta connected."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  const connected = connection?.status === "CONNECTED";

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-teal-950">Integrations · Meta</h2>
          <p className="mt-1 text-xs text-slate-500">
            Reconnect or disconnect the Meta Marketing API connection (FR-036).
          </p>
        </div>
        <StatusBadge status={connection?.status || "DISCONNECTED"} />
      </div>

      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">Ad account</dt>
          <dd className="font-medium">{connection?.adAccountId || "—"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">Page</dt>
          <dd className="font-medium">{connection?.pageId || "—"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">Token</dt>
          <dd className="font-mono text-xs text-slate-600">
            {connection?.accessTokenPreview || "none"}
          </dd>
        </div>
      </dl>

      {message && (
        <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">{message}</div>
      )}
      {error && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}

      <div className="mt-4 flex flex-wrap gap-2">
        {!connected ? (
          <button className="btn-primary" disabled={busy} onClick={() => run("connect")}>
            Connect Meta
          </button>
        ) : (
          <>
            <button className="btn-secondary" disabled={busy} onClick={() => run("reconnect")}>
              Reconnect
            </button>
            <button className="btn-ghost text-red-700" disabled={busy} onClick={() => run("disconnect")}>
              Disconnect
            </button>
          </>
        )}
        <Link href="/dashboard/meta" className="btn-secondary">
          Open Meta page
        </Link>
      </div>

      <p className="mt-3 text-xs text-amber-800">
        Disconnect clears usable credentials and blocks Meta writes. Ads already running in Meta may
        continue until stopped in Ads Manager.
      </p>
    </div>
  );
}
