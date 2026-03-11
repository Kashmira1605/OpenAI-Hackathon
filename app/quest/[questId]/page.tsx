import { notFound, redirect } from "next/navigation";
import Link from "next/link";

import { ArcadeStudyGame } from "@/components/ArcadeStudyGame";
import { InteractiveMissionBoard } from "@/components/InteractiveMissionBoard";
import { QuestRewardClaim } from "@/components/QuestRewardClaim";
import { getAssessmentLabel, getNearestAssessment } from "@/lib/courseHelpers";
import { getQuestData } from "@/lib/data";

export default async function QuestPage({
  params
}: {
  params: Promise<{ questId: string }>;
}) {
  const { questId } = await params;
  const state = await getQuestData(questId);
  const quest = state.quest;

  if (state.authUser && !state.onboardingComplete) {
    redirect("/onboarding");
  }

  if (!quest) {
    notFound();
  }

  const course = state.course;
  const nextAssessment = course ? getNearestAssessment(course) : undefined;
  const assessmentLabel = course ? getAssessmentLabel(course) : null;

  return (
    <main className="grid gap-8">
      <section className="rounded-[2rem] border border-black/5 bg-cream p-6 shadow-card">
        {course ? (
          <Link
            href={`/class/${course.id}`}
            className="mb-4 inline-flex rounded-full bg-sand px-4 py-2 text-sm font-semibold text-black/65 transition hover:bg-mist"
          >
            Back to {course.title}
          </Link>
        ) : null}
        <p className="text-sm uppercase tracking-[0.22em] text-black/45">{course?.title}</p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-semibold text-ink">
              {course?.title} World: {quest.topic}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-black/60">
              {nextAssessment
                ? `Current Study Quest: Prep for ${nextAssessment.title}. ${assessmentLabel?.countdown} days left.`
                : quest.summary}
            </p>
            {nextAssessment ? (
              <p className="mt-2 text-sm leading-6 text-black/55">Focus topics: {nextAssessment.topics.join(", ")}</p>
            ) : null}
          </div>
          <div className="rounded-[1.5rem] bg-white px-4 py-3 text-right">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">{quest.badge}</div>
            <div className="mt-1 text-2xl font-semibold text-emberDark">+{quest.xp} XP</div>
          </div>
        </div>
      </section>

      <ArcadeStudyGame quest={quest} />

      <QuestRewardClaim quest={quest} persistToServer={state.source === "supabase" && Boolean(state.authUser)} />

      <section className="rounded-[2rem] border border-black/5 bg-white/70 p-6 shadow-card">
        <h2 className="text-2xl font-semibold text-ink">Optional follow-up missions</h2>
        <p className="mt-1 text-sm text-black/55">Only use these if you want one more short pass after the arcade run.</p>
        <div className="mt-5">
          <InteractiveMissionBoard missions={quest.missions} scope={`quest-${quest.id}`} title="Quest missions" />
        </div>
      </section>
    </main>
  );
}
