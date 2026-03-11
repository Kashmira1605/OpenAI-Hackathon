import { redirect } from "next/navigation";

import { OnboardingForm } from "@/components/OnboardingForm";
import { getAppState } from "@/lib/data";

export default async function OnboardingPage() {
  const state = await getAppState();

  if (!state.authUser) {
    redirect("/auth");
  }

  if (state.onboardingComplete) {
    redirect("/dashboard");
  }

  return (
    <main className="grid gap-8">
      <OnboardingForm initialName={state.authUser.user_metadata?.full_name || state.authUser.email?.split("@")[0] || ""} />
    </main>
  );
}
