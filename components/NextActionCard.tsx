"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Timer, Trophy } from "lucide-react";

export function NextActionCard({
  action
}: {
  action: {
    classId: string;
    classTitle: string;
    questId?: string;
    title: string;
    durationMin: number;
    reason: string;
    xp: number;
  };
}) {
  const href = action.questId ? `/quest/${action.questId}` : `/class/${action.classId}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[2rem] bg-ink p-7 text-cream shadow-card"
    >
      <div className="mb-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
        Next action
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-white/55">{action.classTitle}</p>
          <h2 className="mt-2 text-3xl font-semibold">{action.title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/72">{action.reason}</p>
        </div>
        <div className="grid gap-3 rounded-[1.5rem] bg-white/8 p-4">
          <div className="flex items-center gap-2 text-sm text-white/70">
            <Timer className="h-4 w-4" />
            {action.durationMin} min sprint
          </div>
          <div className="flex items-center gap-2 text-sm text-white/70">
            <Trophy className="h-4 w-4" />
            +{action.xp} XP
          </div>
          <Link
            href={href}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-ember px-4 py-3 text-sm font-semibold text-white transition hover:bg-emberDark"
          >
            Start now
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
