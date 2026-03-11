"use client";

import { useEffect, useMemo, useState } from "react";
import { AlarmClock, Brain, CalendarClock, Flame, MoonStar, Route, ShieldAlert, Timer, Zap } from "lucide-react";

import { Course } from "@/lib/types";

type EnergyMode = "low" | "steady" | "locked-in";
type PlanDay = {
  label: string;
  title: string;
  detail: string;
  minutes: number;
  tone: "now" | "soon" | "buffer";
};

function storageKey(courseId: string) {
  return `study-quest-exam-${courseId}`;
}

function daysUntil(dateString: string) {
  const now = new Date();
  const target = new Date(dateString);
  const ms = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function recommendedMinutes(energyMode: EnergyMode, panicMode: boolean, daysLeft: number) {
  const base = energyMode === "low" ? 5 : energyMode === "steady" ? 10 : 18;
  const urgencyBoost = daysLeft <= 3 ? 4 : daysLeft <= 7 ? 2 : 0;
  return panicMode ? Math.max(6, base + urgencyBoost + 3) : base + urgencyBoost;
}

function dayLabel(offset: number) {
  if (offset === 0) {
    return "Today";
  }

  if (offset === 1) {
    return "Tomorrow";
  }

  return `Day ${offset + 1}`;
}

function pickQuestFocus(course: Course, index: number) {
  const quest = course.quests[index % Math.max(course.quests.length, 1)] ?? course.quests[0];
  const mission = quest?.missions[index % Math.max(quest?.missions.length ?? 1, 1)] ?? quest?.missions[0];

  return {
    quest,
    mission
  };
}

function buildPlan(course: Course, daysLeft: number | null, sprintMinutes: number, panicMode: boolean): PlanDay[] {
  if (daysLeft === null) {
    return [];
  }

  const planLength = panicMode ? Math.min(Math.max(daysLeft, 3), 5) : Math.min(Math.max(daysLeft, 4), 7);

  return Array.from({ length: planLength }, (_, index) => {
    const focus = pickQuestFocus(course, index);
    const title =
      index === 0
        ? focus.mission?.title ?? focus.quest?.topic ?? `Re-enter ${course.title}`
        : index === planLength - 1 && daysLeft <= 2
          ? "Confidence check"
          : focus.quest?.topic ?? focus.mission?.title ?? `${course.title} review`;

    const detail =
      panicMode && index === 0
        ? "Ignore perfection. Do one concept pass and stop as soon as you finish the checkpoint."
        : index === planLength - 1 && daysLeft <= 2
          ? "Run a fast recall check only. No new material unless you are truly blocked."
          : focus.mission
            ? `${focus.mission.durationMin} min mission compressed into a ${Math.max(5, Math.min(sprintMinutes, focus.mission.durationMin + 2))}-minute sprint.`
            : "Review one concept cluster, then close the tab before you spiral into overplanning.";

    return {
      label: dayLabel(index),
      title,
      detail,
      minutes: Math.max(5, sprintMinutes - (index > 0 && !panicMode ? 1 : 0)),
      tone: index === 0 ? "now" : index < 3 ? "soon" : "buffer"
    } satisfies PlanDay;
  });
}

export function FocusSprintPlanner({
  course,
  targetDate,
  targetLabel
}: {
  course: Course;
  targetDate?: string;
  targetLabel?: string;
}) {
  const [manualDate, setManualDate] = useState("");
  const [energyMode, setEnergyMode] = useState<EnergyMode>("steady");
  const [panicMode, setPanicMode] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey(course.id));

    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as {
        manualDate?: string;
        energyMode?: EnergyMode;
        panicMode?: boolean;
      };

      setManualDate(parsed.manualDate ?? "");
      setEnergyMode(parsed.energyMode ?? "steady");
      setPanicMode(Boolean(parsed.panicMode));
    } catch {
      window.localStorage.removeItem(storageKey(course.id));
    }
  }, [course.id]);

  useEffect(() => {
    window.localStorage.setItem(
      storageKey(course.id),
      JSON.stringify({
        manualDate,
        energyMode,
        panicMode
      })
    );
  }, [course.id, energyMode, manualDate, panicMode]);

  useEffect(() => {
    if (secondsLeft === null) {
      return;
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current === null || current <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  const activeDate = manualDate || targetDate || "";
  const daysLeft = activeDate ? daysUntil(activeDate) : null;
  const sprintMinutes = recommendedMinutes(energyMode, panicMode, daysLeft ?? 7);
  const radarPlan = useMemo(() => buildPlan(course, daysLeft, sprintMinutes, panicMode), [course, daysLeft, panicMode, sprintMinutes]);
  const dailyFocus = useMemo(() => {
    if (daysLeft === null) {
      return "Set a test date and the app will turn it into a tiny, realistic sprint plan.";
    }

    if (panicMode) {
      return `Panic mode plan: do ${sprintMinutes} minutes today, review one concept cluster, and finish with two checkpoint questions.`;
    }

    if (daysLeft <= 2) {
      return `High-priority plan: one ${sprintMinutes}-minute recall sprint, then one short quiz duel before stopping.`;
    }

    if (daysLeft <= 7) {
      return `Exam is next week. Today’s best move is a ${sprintMinutes}-minute sprint on ${course.title}, then stop before overwhelm kicks in.`;
    }

    return `Low-pressure build mode: start with ${sprintMinutes} minutes and bank momentum early.`;
  }, [course.title, daysLeft, panicMode, sprintMinutes]);
  const rescueCopy = useMemo(() => {
    if (daysLeft === null) {
      return "No exam date yet. Start by setting one so the app can cut the work into daily pieces.";
    }

    if (panicMode) {
      return `Panic mode is active. The goal is no longer perfect coverage. It is controlled damage across the next ${Math.max(daysLeft, 1)} day${Math.max(daysLeft, 1) === 1 ? "" : "s"}.`;
    }

    if (energyMode === "low") {
      return "Low-energy mode avoids heavy reading. Use recall, cards, and short checkpoints instead.";
    }

    return "This plan is intentionally small. The goal is to start fast enough that procrastination loses its grip.";
  }, [daysLeft, energyMode, panicMode]);

  const secondsDisplay =
    secondsLeft === null
      ? `${sprintMinutes}:00`
      : `${Math.floor(secondsLeft / 60)
          .toString()
          .padStart(2, "0")}:${(secondsLeft % 60).toString().padStart(2, "0")}`;

  const timerRunning = secondsLeft !== null && secondsLeft > 0;
  const visiblePlan = radarPlan.slice(0, 2);

  return (
    <section className="grid gap-5 rounded-[2rem] border border-black/5 bg-[#F4EEE1] p-6 shadow-card">
      {timerRunning ? (
        <div className="sticky top-4 z-10 rounded-[1.5rem] bg-[#243127] px-5 py-4 text-cream shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-white/60">Sprint in progress</div>
              <div className="mt-1 text-4xl font-semibold">{secondsDisplay}</div>
            </div>
            <div className="text-sm text-white/75">
              Focus only on {course.title} for the next {Math.ceil(secondsLeft / 60)} minute{Math.ceil(secondsLeft / 60) === 1 ? "" : "s"}.
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-black/55">
            <Brain className="h-4 w-4 text-ember" />
            ADHD focus support
          </div>
          <h2 className="mt-3 text-3xl font-semibold text-ink">Start-now sprint planner</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-black/60">
            This is here to reduce procrastination. Set a primary deadline, pick your energy level, and let the app shrink the work into one doable session.
          </p>
        </div>
        <div className="rounded-full bg-[#243127] px-4 py-3 text-sm font-semibold text-cream">
          {timerRunning ? `Sprint running ${secondsDisplay}` : `${sprintMinutes} min focus block`}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_0.9fr]">
        <label className="grid gap-2 text-sm font-medium text-black/70">
          Primary deadline
          <input
            type="date"
            value={activeDate}
            onChange={(event) => setManualDate(event.target.value)}
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none"
          />
          {targetDate && !manualDate ? (
            <span className="text-xs text-black/45">Using tracked deadline: {targetLabel ?? targetDate}</span>
          ) : null}
        </label>

        <div className="grid gap-2 text-sm font-medium text-black/70">
          Energy mode
          <div className="flex flex-wrap gap-2">
            {[
              { id: "low", label: "Low energy", icon: AlarmClock },
              { id: "steady", label: "Normal", icon: Timer },
              { id: "locked-in", label: "Locked in", icon: Zap }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setEnergyMode(id as EnergyMode)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition ${
                  energyMode === id ? "bg-ember text-white" : "bg-white text-black/65 hover:bg-sand"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-2 text-sm font-medium text-black/70">
          Rescue mode
          <button
            type="button"
            onClick={() => setPanicMode((current) => !current)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition ${
              panicMode ? "bg-[#243127] text-white" : "bg-white text-black/65 hover:bg-sand"
            }`}
          >
            <Flame className="h-4 w-4" />
            {panicMode ? "Panic mode on" : "I am behind"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[1.5rem] bg-white p-5">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">What to do now</div>
          <p className="mt-3 text-lg font-semibold text-ink">{dailyFocus}</p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-black/60">
            <span className="rounded-full bg-sand px-3 py-2">{sprintMinutes} min recommended</span>
            {daysLeft !== null ? <span className="rounded-full bg-sand px-3 py-2">{daysLeft} days left</span> : null}
            <span className="rounded-full bg-sand px-3 py-2">{course.title}</span>
          </div>
        </div>
        <div className="grid gap-3 rounded-[1.5rem] bg-white p-5">
          <button
            type="button"
            onClick={() => setSecondsLeft(sprintMinutes * 60)}
            className="rounded-full bg-ember px-4 py-3 text-sm font-semibold text-white transition hover:bg-emberDark"
          >
            Start {sprintMinutes}-minute sprint
          </button>
          <button
            type="button"
            onClick={() => setSecondsLeft(5 * 60)}
            className="rounded-full bg-[#243127] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1A241C]"
          >
            Rescue start: 5 minutes only
          </button>
          <button
            type="button"
            onClick={() => setSecondsLeft(null)}
            className="rounded-full bg-sand px-4 py-3 text-sm font-semibold text-black/70 transition hover:bg-mist"
          >
            Reset timer
          </button>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.5rem] bg-white p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
            <CalendarClock className="h-4 w-4 text-ember" />
            Next steps
          </div>
          <p className="mt-3 text-sm leading-6 text-black/60">{rescueCopy}</p>
          {visiblePlan.length > 0 ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {visiblePlan.map((item, index) => (
                <div
                  key={`${item.label}-${item.title}-${index}`}
                  className={`rounded-[1.25rem] p-4 ${index === 0 ? "bg-[#243127] text-white" : "bg-cream text-black"}`}
                >
                  <div className={`text-xs font-semibold uppercase tracking-[0.18em] ${index === 0 ? "text-white/65" : "text-black/45"}`}>
                    {item.label}
                  </div>
                  <div className="mt-2 text-lg font-semibold">{item.title}</div>
                  <div className={`mt-2 text-sm leading-6 ${index === 0 ? "text-white/75" : "text-black/60"}`}>{item.detail}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-[1.25rem] bg-cream p-4 text-sm text-black/60">
              Add a deadline to turn this into a calmer two-step plan.
            </div>
          )}
        </div>

        <div className="rounded-[1.5rem] bg-white p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
            {panicMode ? <ShieldAlert className="h-4 w-4 text-ember" /> : energyMode === "low" ? <MoonStar className="h-4 w-4 text-ember" /> : <Route className="h-4 w-4 text-ember" />}
            Support note
          </div>
          <h3 className="mt-3 text-xl font-semibold text-ink">
            {panicMode ? "Recovery mode is active" : energyMode === "low" ? "Low-energy mode is active" : "Keep the plan intentionally small"}
          </h3>
          <p className="mt-2 text-sm leading-6 text-black/60">
            {panicMode
              ? "Cut the target down. One concept cluster and two questions is enough for today."
              : energyMode === "low"
                ? "Use quick recall and recognition tasks first. Do not force a long reading block."
                : "The goal is to start cleanly and stop before the work starts feeling huge."}
          </p>
        </div>
      </section>
    </section>
  );
}
