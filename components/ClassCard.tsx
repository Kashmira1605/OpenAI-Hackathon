"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Zap } from "lucide-react";

import { Course } from "@/lib/types";

export function ClassCard({ course }: { course: Course }) {
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

      <Link
        href={`/class/${course.id}`}
        className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-ember transition hover:text-emberDark"
      >
        Open class hub
        <ArrowRight className="h-4 w-4" />
      </Link>
    </motion.div>
  );
}
