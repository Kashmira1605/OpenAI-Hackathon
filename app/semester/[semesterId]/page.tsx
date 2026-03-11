import { notFound, redirect } from "next/navigation";

import { ProgressRing } from "@/components/ProgressRing";
import { getSemesterData } from "@/lib/data";

export default async function SemesterPage({
  params
}: {
  params: Promise<{ semesterId: string }>;
}) {
  const { semesterId } = await params;
  const state = await getSemesterData(semesterId);
  const semester = state.semester;

  if (state.authUser && !state.onboardingComplete) {
    redirect("/onboarding");
  }

  if (!semester) {
    notFound();
  }

  const averageCompletion = Math.round(
    semester.classes.reduce((sum, course) => sum + course.progress.completionRate, 0) / semester.classes.length
  );
  const uploads = state.recentUploads.filter((upload) => semester.classes.some((course) => course.id === upload.courseId)).slice(0, 6);

  return (
    <main className="grid gap-8">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-black/5 bg-cream p-6 shadow-card">
          <p className="text-sm uppercase tracking-[0.22em] text-black/45">
            {semester.name} {semester.year}
          </p>
          <h1 className="mt-2 text-4xl font-semibold text-ink">Semester mission board</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-black/60">
            Keep the whole semester visible: uploads, class momentum, and where to spend your next 20 minutes.
          </p>
        </div>
        <ProgressRing value={averageCompletion} label="Semester progress" sublabel="Average completion across active classes" />
      </section>

      <section className="grid gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-ink">Semester load map</h2>
          <p className="text-sm text-black/55">
            This is the cross-class view: what is heavy, what is stable, and where your uploads are turning into real study paths.
          </p>
        </div>
        <div className="grid gap-3">
          {semester.classes.map((course) => (
            <a
              key={course.id}
              href={`/class/${course.id}`}
              className="grid gap-4 rounded-[1.75rem] border border-black/5 bg-white/70 p-5 shadow-card transition hover:bg-white lg:grid-cols-[1.2fr_0.5fr_0.5fr_0.35fr]"
            >
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">{course.professor}</div>
                <div className="mt-2 text-2xl font-semibold text-ink">{course.title}</div>
                <div className="mt-2 text-sm text-black/60">
                  {course.materials.length} materials · {course.quests.length} playable quests
                </div>
              </div>
              <div className="rounded-[1.25rem] bg-cream p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">Progress</div>
                <div className="mt-2 text-2xl font-semibold text-ink">{course.progress.completionRate}%</div>
              </div>
              <div className="rounded-[1.25rem] bg-cream p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">XP</div>
                <div className="mt-2 text-2xl font-semibold text-ink">{course.progress.xp}</div>
              </div>
              <div className="flex items-center text-sm font-semibold text-ember">Open class</div>
            </a>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-black/5 bg-white/70 p-6 shadow-card">
          <h2 className="text-2xl font-semibold text-ink">Weekly study progress</h2>
          <div className="mt-5 grid gap-3">
            {semester.classes.map((course) => (
              <div key={course.id} className="rounded-[1.5rem] bg-cream p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="font-semibold text-ink">{course.title}</span>
                  <span className="text-sm text-black/55">{course.progress.completionRate}%</span>
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
          <h2 className="text-2xl font-semibold text-ink">Recent uploads</h2>
          <div className="mt-5 grid gap-3">
            {uploads.map((upload) => (
              <div key={upload.id} className="rounded-[1.5rem] bg-cream p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
                  {upload.type.replace("_", " ")}
                </div>
                <p className="mt-2 font-semibold text-ink">{upload.title}</p>
                <p className="mt-1 text-sm text-black/55">Uploaded {upload.uploadedAt}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
