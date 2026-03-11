import { redirect } from "next/navigation";

import { AuthCard } from "@/components/AuthCard";
import { getAppState } from "@/lib/data";

export default async function AuthPage() {
  const state = await getAppState();

  if (state.authUser) {
    redirect(state.onboardingComplete ? "/dashboard" : "/onboarding");
  }

  return (
    <main className="grid gap-8">
      <AuthCard />
    </main>
  );
}
