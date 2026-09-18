import { Suspense } from "react";
import CampaignsPage from "./campaigns-client";

export default function Page() {
  return (
    <Suspense fallback={<div className="text-sm text-slate-500">Loading campaigns...</div>}>
      <CampaignsPage />
    </Suspense>
  );
}
