import { Award } from "lucide-react";

import { Badge } from "@/lib/types";

export function BadgeCard({ badge }: { badge: Badge }) {
  return (
    <div
      className={`rounded-4xl border p-5 shadow-card ${
        badge.earned ? "border-ember/20 bg-cream" : "border-black/5 bg-white/60"
      }`}
    >
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-sand text-ember">
        <Award className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-semibold text-ink">{badge.title}</h3>
      <p className="mt-2 text-sm leading-6 text-black/60">{badge.description}</p>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
        {badge.earned ? "Unlocked" : "In progress"}
      </p>
    </div>
  );
}
