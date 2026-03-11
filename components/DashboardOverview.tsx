import Link from "next/link";
import { CalendarDays, Flame, Star } from "lucide-react";

import { Semester, Student } from "@/lib/types";

export function DashboardOverview({
  student,
  semester
}: {
  student: Student;
  semester: Semester;
}) {
  const summary = [
    { label: "Total XP", value: student.totalXp, icon: Star },
    { label: "Current streak", value: `${student.streak} days`, icon: Flame },
    { label: "Active classes", value: semester.classes.length, icon: CalendarDays }
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-[2rem] border border-black/5 bg-cream p-6 shadow-card">
        <p className="text-sm uppercase tracking-[0.22em] text-black/45">
          {semester.name} {semester.year}
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-ink">
          {student.name}&apos;s semester dashboard
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-black/60">
          Upload class material, convert it into playable quests, and keep one clear next step visible.
        </p>
        <Link
          href={`/semester/${semester.id}`}
          className="mt-5 inline-flex rounded-full bg-ember px-5 py-3 text-sm font-semibold text-white transition hover:bg-emberDark"
        >
          Open semester board
        </Link>
      </div>

      <div className="grid gap-3">
        {summary.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-[1.75rem] border border-black/5 bg-white/70 p-5 shadow-card">
            <div className="flex items-center gap-3 text-black/55">
              <Icon className="h-4 w-4 text-ember" />
              <span className="text-sm">{label}</span>
            </div>
            <div className="mt-3 text-3xl font-semibold text-ink">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
