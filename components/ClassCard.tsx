"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, CalendarClock, Zap } from "lucide-react";

import { getAssessmentLabel } from "@/lib/courseHelpers";
import { Course } from "@/lib/types";

export function ClassCard({ course }: { course: Course }) {
  const assessment = getAssessmentLabel(course);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="rounded-4xl border border-black/5 bg-cream p-6 shadow-card"
    >
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
            <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: course.color }} />
            {course.number ? `Portal ${course.number}` : null}
            {course.professor}
          </div>
          <h3 className="text-2xl font-semibold text-ink">{course.title}</h3>
        </div>
        <div className="rounded-full bg-sand px-3 py-1 text-sm font-semibold text-emberDark">
          {course.progress.completionRate}% ready
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="rounded-3xl bg-sand p-3">
          <div className="mb-2 flex items-center gap-2 text-black/55">
            <BookOpen className="h-4 w-4" />
            Quests
          </div>
          <div className="text-lg font-semibold">{course.quests.length}</div>
        </div>
        <div className="rounded-3xl bg-sand p-3">
          <div className="mb-2 flex items-center gap-2 text-black/55">
            <Zap className="h-4 w-4" />
            XP
          </div>
          <div className="text-lg font-semibold">{course.progress.xp}</div>
        </div>
        <div className="rounded-3xl bg-sand p-3">
          <div className="mb-2 text-black/55">Uploads</div>
          <div className="text-lg font-semibold">{course.materials.length}</div>
        </div>
      </div>

      <div className="mt-4 rounded-3xl bg-white p-4 text-sm">
        <div className="mb-2 inline-flex items-center gap-2 text-black/55">
          <CalendarClock className="h-4 w-4" />
          Current study quest
        </div>
        <div className="font-semibold text-ink">{assessment.title}</div>
        <div className="mt-1 text-black/55">
          {assessment.countdown !== null ? `${assessment.countdown} days left` : assessment.subtitle}
        </div>
      </div>

      <Link
        href={`/class/${course.id}`}
        className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-ember transition hover:text-emberDark"
      >
        Enter class world
        <ArrowRight className="h-4 w-4" />
      </Link>
    </motion.div>
  );
}
