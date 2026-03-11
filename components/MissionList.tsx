import { CheckCircle2, Circle, Timer } from "lucide-react";

import { Mission } from "@/lib/types";

export function MissionList({ missions }: { missions: Mission[] }) {
  return (
    <div className="grid gap-3">
      {missions.map((mission, index) => (
        <div
          key={`${mission.title}-${mission.durationMin}-${mission.xp}-${index}`}
          className="flex items-center justify-between gap-3 rounded-3xl border border-black/5 bg-cream p-4 shadow-card"
        >
          <div className="flex items-start gap-3">
            {mission.completed ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-olive" />
            ) : (
              <Circle className="mt-0.5 h-5 w-5 text-black/35" />
            )}
            <div>
              <p className="font-semibold text-ink">{mission.title}</p>
              <div className="mt-1 flex items-center gap-2 text-sm text-black/55">
                <Timer className="h-4 w-4" />
                {mission.durationMin} min
              </div>
            </div>
          </div>
          <div className="rounded-full bg-sand px-3 py-1 text-sm font-semibold text-emberDark">+{mission.xp} XP</div>
        </div>
      ))}
    </div>
  );
}
