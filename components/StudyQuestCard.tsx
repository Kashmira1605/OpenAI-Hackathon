import Link from "next/link";
import { ArrowRight, Layers3, Sparkles } from "lucide-react";

import { StudyQuest } from "@/lib/types";

export function StudyQuestCard({ quest }: { quest: StudyQuest }) {
  return (
    <div className="rounded-4xl border border-black/5 bg-cream p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-sand px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-black/60">
          <Sparkles className="h-4 w-4 text-ember" />
          {quest.badge}
        </span>
        <span className="text-sm font-semibold text-emberDark">+{quest.xp} XP</span>
      </div>
      <h3 className="text-xl font-semibold text-ink">{quest.topic}</h3>
      <p className="mt-2 text-sm leading-6 text-black/60">{quest.summary}</p>
      <div className="mt-4 flex items-center gap-4 text-sm text-black/55">
        <span className="inline-flex items-center gap-2">
          <Layers3 className="h-4 w-4" />
          {quest.cards.length} cards
        </span>
        <span>{quest.quiz.length} quiz questions</span>
        <span>{quest.missions.length} missions</span>
      </div>
      <Link
        href={`/quest/${quest.id}`}
        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-ember transition hover:text-emberDark"
      >
        Play study run
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
