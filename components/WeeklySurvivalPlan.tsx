import Link from "next/link";
import { ArrowRight, CalendarRange } from "lucide-react";

import { Course } from "@/lib/types";

type SurvivalItem = {
  day: string;
  course: Course;
  title: string;
  minutes: number;
  reason: string;
};

const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri"];

function buildSurvivalPlan(courses: Course[]): SurvivalItem[] {
  const ranked = [...courses].sort((left, right) => left.progress.completionRate - right.progress.completionRate);

  return dayNames.map((day, index) => {
    const course = ranked[index % Math.max(ranked.length, 1)] ?? courses[0];
    const quest = course?.quests[index % Math.max(course?.quests.length ?? 1, 1)] ?? course?.quests[0];
    const mission = quest?.missions[index % Math.max(quest?.missions.length ?? 1, 1)] ?? quest?.missions[0];
    const urgent = course.progress.completionRate < 50;

    return {
      day,
      course,
      title: mission?.title ?? quest?.topic ?? `Open ${course.title}`,
      minutes: mission?.durationMin ?? (urgent ? 8 : 5),
      reason: urgent
        ? "Needs protection this week before it turns into avoidance."
        : "Maintenance touch only. Enough to keep the class alive."
    };
  });
}

export function WeeklySurvivalPlan({ courses }: { courses: Course[] }) {
  if (!courses.length) {
    return null;
  }

  const plan = buildSurvivalPlan(courses);

  return (
    <section className="grid gap-4 rounded-[2rem] border border-black/5 bg-cream p-6 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-sand px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-black/55">
            <CalendarRange className="h-4 w-4 text-ember" />
            Weekly survival plan
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-ink">One small win per day across classes</h2>
          <p className="mt-2 max-w-2xl text-sm text-black/55">
            This is not a full schedule. It is the minimum cross-class plan that keeps everything from collapsing at once.
          </p>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-5">
        {plan.map((item, index) => (
          <Link
            key={`${item.day}-${item.course.id}-${item.title}-${index}`}
            href={`/class/${item.course.id}`}
            className="rounded-[1.5rem] bg-white p-4 transition hover:bg-mist"
          >
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">{item.day}</div>
            <div className="mt-2 text-sm font-semibold text-black/45">{item.course.title}</div>
            <div className="mt-2 text-lg font-semibold text-ink">{item.title}</div>
            <div className="mt-3 text-sm text-black/60">{item.reason}</div>
            <div className="mt-4 flex items-center justify-between text-sm font-semibold text-ember">
              <span>{item.minutes} min</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
