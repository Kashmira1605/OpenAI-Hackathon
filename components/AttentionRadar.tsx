import Link from "next/link";
import { ArrowRight, BatteryLow, Compass, ShieldCheck } from "lucide-react";

import { Course } from "@/lib/types";

type AttentionRadarProps = {
  courses: Course[];
};

function firstMission(course: Course) {
  const quest = course.quests[0];
  const mission = quest?.missions[0];

  return {
    quest,
    mission
  };
}

export function AttentionRadar({ courses }: AttentionRadarProps) {
  const ranked = [...courses].sort((left, right) => left.progress.completionRate - right.progress.completionRate);
  const doNow = ranked[0];
  const keepWarm = ranked[1] ?? ranked[0];
  const safeToIgnore = [...ranked].sort((left, right) => right.progress.completionRate - left.progress.completionRate)[0];

  if (!doNow) {
    return null;
  }

  const doNowPlan = firstMission(doNow);
  const keepWarmPlan = keepWarm ? firstMission(keepWarm) : null;

  return (
    <section className="grid gap-4 rounded-[2rem] border border-black/5 bg-white/70 p-6 shadow-card">
      <div>
        <h2 className="text-2xl font-semibold text-ink">Attention radar</h2>
        <p className="mt-1 max-w-2xl text-sm text-black/55">
          ADHD is often a prioritization problem before it becomes a study problem. This view decides what needs
          attention, what only needs maintenance, and what you can safely ignore today.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-[1.75rem] bg-[#1f2d23] p-5 text-white">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
            <Compass className="h-4 w-4" />
            Do now
          </div>
          <h3 className="mt-4 text-2xl font-semibold">{doNow.title}</h3>
          <p className="mt-2 text-sm text-white/75">
            Lowest momentum right now. Protect this class first so it does not become tomorrow&apos;s panic.
          </p>
          <div className="mt-5 rounded-[1.25rem] bg-white/10 p-4 text-sm text-white/85">
            <div className="font-semibold">{doNowPlan.mission?.title ?? doNowPlan.quest?.topic ?? "Open this class hub"}</div>
            <div className="mt-1 text-white/65">
              {doNowPlan.mission ? `${doNowPlan.mission.durationMin} min · +${doNowPlan.mission.xp} XP` : "Start with one short mission"}
            </div>
          </div>
          <Link
            href={`/class/${doNow.id}`}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-ember px-4 py-3 text-sm font-semibold text-white transition hover:bg-emberDark"
          >
            Go to {doNow.title}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {keepWarmPlan ? (
          <div className="rounded-[1.75rem] bg-cream p-5 shadow-card">
            <div className="inline-flex items-center gap-2 rounded-full bg-sand px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-black/55">
              <BatteryLow className="h-4 w-4 text-ember" />
              Keep warm
            </div>
            <h3 className="mt-4 text-2xl font-semibold text-ink">{keepWarm.title}</h3>
            <p className="mt-2 text-sm text-black/60">
              This class does not need a deep session. A tiny touch keeps it from slipping off your radar.
            </p>
            <div className="mt-5 rounded-[1.25rem] bg-white p-4 text-sm text-black/70">
              <div className="font-semibold text-ink">
                {keepWarmPlan.mission?.title ?? keepWarmPlan.quest?.topic ?? "Do one micro review"}
              </div>
              <div className="mt-1 text-black/55">
                {keepWarmPlan.mission
                  ? `${keepWarmPlan.mission.durationMin} min maintenance task`
                  : "A short recall pass is enough today"}
              </div>
            </div>
            <Link href={`/class/${keepWarm.id}`} className="mt-5 inline-flex text-sm font-semibold text-ember">
              Open maintenance plan
            </Link>
          </div>
        ) : null}

        {safeToIgnore ? (
          <div className="rounded-[1.75rem] bg-white p-5 shadow-card">
            <div className="inline-flex items-center gap-2 rounded-full bg-olive/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-olive">
              <ShieldCheck className="h-4 w-4" />
              Safe to ignore
            </div>
            <h3 className="mt-4 text-2xl font-semibold text-ink">{safeToIgnore.title}</h3>
            <p className="mt-2 text-sm text-black/60">
              Highest momentum right now. You have permission to not touch this class today unless you have extra energy.
            </p>
            <div className="mt-5 rounded-[1.25rem] bg-cream p-4 text-sm text-black/65">
              Progress buffer: {safeToIgnore.progress.completionRate}% complete and {safeToIgnore.progress.xp} XP banked.
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
