import { notFound, redirect } from "next/navigation";
import Link from "next/link";

import { ClassSupportPanel } from "@/components/ClassSupportPanel";
import { InteractiveMissionBoard } from "@/components/InteractiveMissionBoard";
import { ProgressRing } from "@/components/ProgressRing";
import { StudyQuestCard } from "@/components/StudyQuestCard";
import { UploadMaterialCard } from "@/components/UploadMaterialCard";
import { getAssessmentLabel, getNearestAssessment } from "@/lib/courseHelpers";
import { getCourseData } from "@/lib/data";

export default async function ClassHubPage({
  params
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const state = await getCourseData(classId);
  const course = state.course;

  if (state.authUser && !state.onboardingComplete) {
    redirect("/onboarding");
  }

  if (!course) {
    notFound();
  }

  const nextAssessment = getNearestAssessment(course);
  const assessmentLabel = getAssessmentLabel(course);

  return (
    <main className="grid gap-8">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-black/5 bg-cream p-6 shadow-card">
          <p className="text-sm uppercase tracking-[0.22em] text-black/45">
            {course.number ? `Portal ${course.number}` : "Class world"} · {course.professor}
          </p>
          <h1 className="mt-2 text-4xl font-semibold text-ink">{course.title} World</h1>
          <p className="mt-3 text-sm leading-6 text-black/60">
            Objective: {assessmentLabel.title}
            {assessmentLabel.countdown !== null ? ` · ${assessmentLabel.countdown} days left` : ""}
          </p>
          <p className="mt-2 text-sm leading-6 text-black/55">
            {nextAssessment
              ? `Study topics: ${nextAssessment.topics.join(", ")}`
              : course.syllabus}
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-sand px-4 py-2 font-semibold text-emberDark">{course.progress.xp} XP</span>
            <span className="rounded-full bg-sand px-4 py-2 font-semibold text-black/60">
              {course.progress.missionsCompleted} missions complete
            </span>
            <span className="rounded-full bg-sand px-4 py-2 font-semibold text-black/60">
              {course.materials.length} materials uploaded
            </span>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="#study-planner" className="rounded-full bg-[#243127] px-4 py-3 text-sm font-semibold text-white">
              Prep {assessmentLabel.title}
            </Link>
            <Link href="#build-quest" className="rounded-full bg-ember px-4 py-3 text-sm font-semibold text-white">
              Upload syllabus or notes
            </Link>
          </div>
        </div>
        <ProgressRing
          value={course.progress.completionRate}
          label={nextAssessment ? nextAssessment.title : "Class progress"}
          sublabel={nextAssessment ? `${nextAssessment.type} countdown: ${assessmentLabel.countdown ?? "n/a"} days` : "Based on quest completion and missions done"}
        />
      </section>

      <section id="build-quest" className="grid gap-4">
        <UploadMaterialCard
          courseId={course.id}
          courseTitle={course.title}
          initialType={course.materials.length === 0 ? "syllabus" : "lecture_notes"}
          headline={course.materials.length === 0 ? "Start with your course syllabus" : "Upload or paste class material"}
          subcopy={
            course.materials.length === 0
              ? "Paste the syllabus first. Study Quest will use it as the map for what the course covers and how to study it over the semester."
              : "Paste notes, transcripts, or guides here to turn them into quests, missions, and study games."
          }
        />
      </section>

      <ClassSupportPanel course={course} />

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-black/5 bg-white/70 p-6 shadow-card">
          <div className="mt-5">
            <InteractiveMissionBoard
              missions={course.quests.flatMap((quest) => quest.missions).slice(0, 4)}
              scope={`course-${course.id}`}
            />
          </div>
        </div>

        <div className="grid gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-ink">Generated study quests</h2>
            <p className="text-sm text-black/55">
              These quests should help you prep for {assessmentLabel.title.toLowerCase()} inside this class world.
            </p>
          </div>
          {course.quests.map((quest) => (
            <StudyQuestCard key={quest.id} quest={quest} />
          ))}
        </div>
      </section>
    </main>
  );
}
