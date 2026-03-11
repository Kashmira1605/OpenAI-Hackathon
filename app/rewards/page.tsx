import { redirect } from "next/navigation";
import { BadgeCard } from "@/components/BadgeCard";
import { LeaderboardPanel } from "@/components/LeaderboardPanel";
import { ProgressRing } from "@/components/ProgressRing";
import { RewardsVault } from "@/components/RewardsVault";
import { getAppState } from "@/lib/data";

export default async function RewardsPage() {
  const state = await getAppState();

  if (state.authUser && !state.onboardingComplete) {
    redirect("/onboarding");
  }

  const semesterProgress = Math.round(
    state.currentSemester.classes.reduce((sum, course) => sum + course.progress.completionRate, 0) /
      state.currentSemester.classes.length
  );
  const serverClaimedXp = state.academicYear.semesters.reduce(
    (semesterSum, semester) =>
      semesterSum +
      semester.classes.reduce(
        (courseSum, course) =>
          courseSum + course.quests.reduce((questSum, quest) => questSum + (quest.completed ? quest.xp : 0), 0),
        0
      ),
    0
  );

  return (
    <main className="grid gap-8">
      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] border border-black/5 bg-cream p-6 shadow-card">
          <p className="text-sm uppercase tracking-[0.22em] text-black/45">Rewards and progress</p>
          <h1 className="mt-2 text-4xl font-semibold text-ink">Keep the year visible</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-black/60">
            Progress is tracked across class quests, weekly study wins, and the full academic year.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.5rem] bg-white p-4">
              <p className="text-sm text-black/55">Total XP</p>
              <p className="mt-2 text-3xl font-semibold text-ink">{state.student.totalXp}</p>
            </div>
            <div className="rounded-[1.5rem] bg-white p-4">
              <p className="text-sm text-black/55">Streak</p>
              <p className="mt-2 text-3xl font-semibold text-ink">{state.student.streak} days</p>
            </div>
            <div className="rounded-[1.5rem] bg-white p-4">
              <p className="text-sm text-black/55">Level</p>
              <p className="mt-2 text-3xl font-semibold text-ink">{state.student.level}</p>
            </div>
          </div>
        </div>
        <ProgressRing value={semesterProgress} label="Current semester" sublabel="Average across all active classes" />
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-black/5 bg-white/70 p-6 shadow-card">
          <h2 className="text-2xl font-semibold text-ink">Class-by-class progress</h2>
          <div className="mt-5 grid gap-3">
            {state.currentSemester.classes.map((course) => (
              <div key={course.id} className="rounded-[1.5rem] bg-cream p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="font-semibold text-ink">{course.title}</span>
                  <span className="text-sm text-black/55">{course.progress.xp} XP</span>
                </div>
                <div className="h-3 rounded-full bg-mist">
                  <div
                    className="h-3 rounded-full"
                    style={{ width: `${course.progress.completionRate}%`, backgroundColor: course.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-black/5 bg-white/70 p-6 shadow-card">
          <h2 className="text-2xl font-semibold text-ink">Academic year overview</h2>
          <div className="mt-5 grid gap-3">
            {state.academicYear.semesters.map((semester) => (
              <div key={semester.id} className="rounded-[1.5rem] bg-cream p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-ink">
                    {semester.name} {semester.year}
                  </span>
                  <span className="text-sm text-black/55">{semester.classes.length} classes</span>
                </div>
              </div>
            ))}
            <div className="rounded-[1.5rem] bg-sand p-4 text-sm text-black/65">
              Archived classes this year: {state.academicYear.archivedClasses}
            </div>
          </div>
        </div>
      </section>

      <LeaderboardPanel student={state.student} />

      <RewardsVault serverBadges={state.badges} serverClaimedXp={serverClaimedXp} />
    </main>
  );
}
