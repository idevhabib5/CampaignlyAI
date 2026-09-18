export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell } from "@/components/ui";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN" && user.business && !user.business.onboardingComplete) {
    redirect("/onboarding");
  }

  return (
    <DashboardShell
      user={{
        name: user.name,
        email: user.email,
        role: user.role,
        businessName: user.business?.businessName,
      }}
    >
      {children}
    </DashboardShell>
  );
}
