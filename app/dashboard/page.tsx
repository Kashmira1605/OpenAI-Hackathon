import { redirect } from "next/navigation";

import { AttentionRadar } from "@/components/AttentionRadar";
import { DashboardOverview } from "@/components/DashboardOverview";
import { NextActionCard } from "@/components/NextActionCard";
import { WeeklySurvivalPlan } from "@/components/WeeklySurvivalPlan";
import { getAppState } from "@/lib/data";

export default async function DashboardPage() {
  const state = await getAppState();

  if (state.authUser && !state.onboardingComplete) {
    redirect("/onboarding");
  }

  const upcoming = state.upcomingMissions.slice(0, 4);

  return (
    <main className="grid gap-8">
      <DashboardOverview student={state.student} semester={state.currentSemester} />
      <NextActionCard action={state.nextAction} />
      <AttentionRadar courses={state.currentSemester.classes} />
      <WeeklySurvivalPlan courses={state.currentSemester.classes} />

      <section className="grid gap-4 rounded-[2rem] border border-black/5 bg-white/70 p-6 shadow-card">
        <div>
          <h2 className="text-2xl font-semibold text-ink">Low-friction starts</h2>
          <p className="text-sm text-black/55">If you have a little energy, pick one of these and stop after that.</p>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {upcoming.map((mission, index) => (
            <div key={`${mission.courseId}-${mission.questId}-${mission.title}-${index}`} className="rounded-[1.5rem] bg-cream p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">{mission.courseTitle}</div>
              <p className="mt-2 font-semibold text-ink">{mission.title}</p>
              <p className="mt-1 text-sm text-black/55">
                {mission.durationMin} min · +{mission.xp} XP
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
