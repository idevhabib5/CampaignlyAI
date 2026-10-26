"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader, StatusBadge } from "@/components/ui";

type Connection = {
  connected: boolean;
  status: string;
  adAccounts: Array<{ id: string; name: string; currency: string }>;
  pages: Array<{ id: string; name: string }>;
  accessTokenPreview: string | null;
  adAccountId: string | null;
  pageId: string | null;
};

export default function MetaConnectPage() {
  const [connection, setConnection] = useState<Connection | null>(null);
  const [adAccountId, setAdAccountId] = useState("");
  const [pageId, setPageId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function refresh() {
    const res = await fetch("/api/meta/connect");
    const data = await res.json();
    setConnection(data.connection);
    setAdAccountId(data.connection?.adAccountId || data.connection?.adAccounts?.[0]?.id || "");
    setPageId(data.connection?.pageId || data.connection?.pages?.[0]?.id || "");
  }

  useEffect(() => {
    refresh();
  }, []);

  async function connect(action: "connect" | "reconnect" = "connect") {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/meta/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Meta connect failed");
      setConnection(data.connection);
      setAdAccountId(data.connection.adAccountId || "");
      setPageId(data.connection.pageId || "");
      setMessage(
        action === "reconnect"
          ? "Meta reconnected. Tokens expire periodically (LI-5)."
          : "Meta OAuth completed (mock). Select Page and ad account, then deploy from Campaigns."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connect failed");
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
        body: JSON.stringify({ action: "select_assets", adAccountId, pageId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save assets");
      setConnection(data.connection);
      setMessage("Page and ad account saved for this tenant (FR-027).");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    if (
      !window.confirm(
        "Disconnect Meta? Existing ads may continue running in Meta Ads Manager until you stop them there."
      )
    ) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/meta/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Disconnect failed");
      setConnection(data.connection);
      setMessage(data.message || "Meta disconnected.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  const connected = connection?.status === "CONNECTED";

  return (
    <div>
      <PageHeader
        title="Meta account connection"
        description="Mock OAuth to Facebook Pages and Ad Accounts. Live Graph swap stays behind USE_MOCK_META."
        actions={
          <Link href="/dashboard/campaigns" className="btn-secondary">
            Go to campaigns
          </Link>
        }
      />
      {message && (
        <div className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</div>
      )}
      {error && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-semibold text-teal-950">Connection status</div>
            <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
              <StatusBadge status={connection?.status || "DISCONNECTED"} />
              {connection?.accessTokenPreview && (
                <span className="text-xs text-slate-500">Token: {connection.accessTokenPreview}</span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {!connected ? (
              <button className="btn-primary" disabled={busy} onClick={() => connect("connect")}>
                {busy ? "Connecting..." : "Connect with Meta"}
              </button>
            ) : (
              <>
                <button className="btn-secondary" disabled={busy} onClick={() => connect("reconnect")}>
                  Reconnect
                </button>
                <button className="btn-ghost text-red-700" disabled={busy} onClick={disconnect}>
                  Disconnect
                </button>
              </>
            )}
          </div>
        </div>

        {connection && (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Ad account</label>
              <select
                className="input"
                disabled={!connected}
                value={adAccountId}
                onChange={(e) => setAdAccountId(e.target.value)}
              >
                {connection.adAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} · {a.id} · {a.currency}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Facebook Page</label>
              <select
                className="input"
                disabled={!connected}
                value={pageId}
                onChange={(e) => setPageId(e.target.value)}
              >
                {connection.pages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.id}
                  </option>
                ))}
              </select>
            </div>
            {connected && (
              <div className="md:col-span-2">
                <button className="btn-secondary" disabled={busy} onClick={saveAssets}>
                  Save selected assets
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card mt-4 border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Disconnect clears local credentials and blocks Meta writes until reconnect. Ads already live
        in Meta may keep running — use Ads Manager for urgent stops (FR-036 / LI-2).
      </div>
    </div>
  );
}
