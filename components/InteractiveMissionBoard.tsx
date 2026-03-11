"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Circle, PlayCircle, Timer } from "lucide-react";

import { countCompleted, missionStorageId, readMissionProgress, writeMissionProgress } from "@/lib/clientProgress";
import { Mission } from "@/lib/types";

export function InteractiveMissionBoard({
  missions,
  scope,
  title = "Current missions"
}: {
  missions: Mission[];
  scope: string;
  title?: string;
}) {
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [activeSeconds, setActiveSeconds] = useState<number | null>(null);

  useEffect(() => {
    setProgress(readMissionProgress(scope));
  }, [scope]);

  useEffect(() => {
    if (activeSeconds === null) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveSeconds((current) => {
        if (current === null || current <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [activeSeconds]);

  const completedCount = useMemo(() => countCompleted(progress), [progress]);

  const toggleMission = (mission: Mission, index: number) => {
    const id = missionStorageId(mission, index);
    const next = {
      ...progress,
      [id]: !progress[id]
    };

    setProgress(next);
    writeMissionProgress(scope, next);
  };

  const activeDisplay =
    activeSeconds === null
      ? null
      : `${Math.floor(activeSeconds / 60)
          .toString()
          .padStart(2, "0")}:${(activeSeconds % 60).toString().padStart(2, "0")}`;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-ink">{title}</h2>
          <p className="mt-1 text-sm text-black/55">Start one, finish one, then stop. No giant to-do pile.</p>
        </div>
        <div className="rounded-full bg-sand px-4 py-2 text-sm font-semibold text-black/65">
          {completedCount}/{missions.length} done
        </div>
      </div>

      {activeDisplay ? (
        <div className="rounded-[1.5rem] bg-[#243127] px-4 py-3 text-sm font-semibold text-white">
          Sprint running: {activeDisplay}
        </div>
      ) : null}

      <div className="grid gap-3">
        {missions.map((mission, index) => {
          const id = missionStorageId(mission, index);
          const done = Boolean(progress[id]);

          return (
            <div
              key={`${scope}-${id}`}
              className="flex items-center justify-between gap-3 rounded-3xl border border-black/5 bg-cream p-4 shadow-card"
            >
              <div className="flex items-start gap-3">
                {done ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-olive" />
                ) : (
                  <Circle className="mt-0.5 h-5 w-5 text-black/35" />
                )}
                <div>
                  <p className="font-semibold text-ink">{mission.title}</p>
                  <div className="mt-1 flex items-center gap-2 text-sm text-black/55">
                    <Timer className="h-4 w-4" />
                    {mission.durationMin} min · +{mission.xp} XP
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSeconds(mission.durationMin * 60)}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-semibold text-black/65 transition hover:bg-sand"
                >
                  <PlayCircle className="h-4 w-4" />
                  Start
                </button>
                <button
                  type="button"
                  onClick={() => toggleMission(mission, index)}
                  className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                    done ? "bg-sand text-black/65 hover:bg-mist" : "bg-ember text-white hover:bg-emberDark"
                  }`}
                >
                  {done ? "Undo" : "Mark done"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
