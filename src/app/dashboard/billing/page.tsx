import { Suspense } from "react";
import BillingPage from "./billing-client";

export default function Page() {
  return (
    <Suspense fallback={<div className="text-sm text-slate-500">Loading billing...</div>}>
      <BillingPage />
    </Suspense>
  );
}
