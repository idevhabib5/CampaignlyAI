"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminUserActions({ userId }: { userId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function setPlan(plan: string, status = "ACTIVE") {
    setBusy(true);
    await fetch("/api/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, plan, status }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-1">
      <button className="btn-secondary px-2 py-1 text-xs" disabled={busy} onClick={() => setPlan("STARTER")}>
        Starter
      </button>
      <button className="btn-secondary px-2 py-1 text-xs" disabled={busy} onClick={() => setPlan("PRO")}>
        Pro
      </button>
      <button
        className="btn-ghost px-2 py-1 text-xs text-red-700"
        disabled={busy}
        onClick={() => setPlan("TRIAL", "CANCELED")}
      >
        Cancel
      </button>
    </div>
  );
}
