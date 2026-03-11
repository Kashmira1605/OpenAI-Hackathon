"use client";

import { useMemo, useState } from "react";

import { DeadlineTracker, TrackedDeadline } from "@/components/DeadlineTracker";
import { FocusSprintPlanner } from "@/components/FocusSprintPlanner";
import { ReminderBell } from "@/components/ReminderBell";
import { Course } from "@/lib/types";

function getNextDeadline(deadlines: TrackedDeadline[]) {
  return [...deadlines]
    .filter((item) => !item.completed)
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate))[0];
}

export function ClassSupportPanel({ course }: { course: Course }) {
  const [deadlines, setDeadlines] = useState<TrackedDeadline[]>([]);
  const nextDeadline = useMemo(() => getNextDeadline(deadlines), [deadlines]);

  return (
    <section id="study-planner" className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
      <FocusSprintPlanner
        course={course}
        targetDate={nextDeadline?.dueDate}
        targetLabel={nextDeadline ? `${nextDeadline.kind}: ${nextDeadline.title}` : undefined}
      />
      <div className="grid gap-4 self-start">
        <ReminderBell courseTitle={course.title} targetLabel={nextDeadline?.title} />
        <DeadlineTracker courseId={course.id} onDeadlinesChange={setDeadlines} />
      </div>
    </section>
  );
}
