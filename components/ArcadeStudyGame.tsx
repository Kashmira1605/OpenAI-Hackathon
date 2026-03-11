"use client";

import { useEffect, useMemo, useState } from "react";
import { Gamepad2, RotateCcw, Shield, Timer, Zap } from "lucide-react";

import { StudyQuest } from "@/lib/types";

type Round = {
  id: string;
  prompt: string;
  clue: string;
  options: string[];
  answer: string;
  concept: string;
  kind: "standard" | "boss";
};

function buildRounds(quest: StudyQuest): Round[] {
  const baseRounds = quest.quiz.map((item, index) => ({
    id: `${quest.id}-round-${index}`,
    prompt: item.question,
    clue: quest.cards[index % Math.max(quest.cards.length, 1)]?.visualHint ?? quest.summary,
    options: item.options,
    answer: item.answer,
    concept: quest.cards[index % Math.max(quest.cards.length, 1)]?.title ?? `Concept ${index + 1}`,
    kind: "standard" as const
  }));

  if (baseRounds.length === 0) {
    return [
      {
        id: `${quest.id}-boss-fallback`,
        prompt: `Which statement best matches ${quest.topic}?`,
        clue: quest.summary,
        options: [
          quest.cards[0]?.explanation ?? quest.summary,
          "An unrelated detail from another chapter",
          "A distractor with similar wording",
          "A made-up answer with no evidence"
        ],
        answer: quest.cards[0]?.explanation ?? quest.summary,
        concept: quest.cards[0]?.title ?? quest.topic,
        kind: "boss"
      }
    ];
  }

  return [
    ...baseRounds,
    {
      id: `${quest.id}-boss`,
      prompt: `Boss round: which idea best captures ${quest.topic}?`,
      clue: quest.summary,
      options: [
        quest.cards[0]?.explanation ?? quest.summary,
        "A side note from a different lecture",
        "A distractor that sounds academic but misses the point",
        "A detail that contradicts the uploaded material"
      ],
      answer: quest.cards[0]?.explanation ?? quest.summary,
      concept: quest.topic,
      kind: "boss"
    }
  ];
}

function scoreForRound(round: Round) {
  return round.kind === "boss" ? 40 : 20;
}

export function ArcadeStudyGame({ quest }: { quest: StudyQuest }) {
  const rounds = useMemo(() => buildRounds(quest), [quest]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [hits, setHits] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(75);
  const [mode, setMode] = useState<"ready" | "play" | "done">("ready");

  const round = rounds[currentIndex];
  const progress = Math.round(((currentIndex + (mode === "done" ? 1 : 0)) / Math.max(rounds.length, 1)) * 100);

  useEffect(() => {
    if (mode !== "play") {
      return;
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setMode("done");
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [mode]);

  useEffect(() => {
    const serialize = () =>
      JSON.stringify({
        coordinate_system: "ui-state only",
        mode,
        currentRound: currentIndex,
        totalRounds: rounds.length,
        score,
        streak,
        hits,
        secondsLeft,
        selected,
        locked,
        prompt: round?.prompt ?? null,
        options: round?.options ?? []
      });

    window.render_game_to_text = serialize;
    window.advanceTime = (ms: number) => {
      const seconds = Math.max(1, Math.round(ms / 1000));
      setSecondsLeft((current) => Math.max(0, current - seconds));
      return serialize();
    };

    return () => {
      delete window.render_game_to_text;
      delete window.advanceTime;
    };
  }, [currentIndex, hits, locked, mode, round, rounds.length, score, secondsLeft, selected, streak]);

  const start = () => {
    setMode("play");
  };

  const restart = () => {
    setCurrentIndex(0);
    setSelected(null);
    setLocked(false);
    setScore(0);
    setStreak(0);
    setHits(0);
    setSecondsLeft(75);
    setMode("ready");
  };

  const submit = () => {
    if (!selected || !round || locked) {
      return;
    }

    const correct = selected === round.answer;
    setLocked(true);

    if (correct) {
      setScore((current) => current + scoreForRound(round) + streak * 5);
      setStreak((current) => current + 1);
      setHits((current) => current + 1);
    } else {
      setStreak(0);
    }

    window.setTimeout(() => {
      const nextIndex = currentIndex + 1;

      if (nextIndex >= rounds.length) {
        setMode("done");
      } else {
        setCurrentIndex(nextIndex);
      }

      setSelected(null);
      setLocked(false);
    }, 650);
  };

  return (
    <section className="grid gap-6 rounded-[2rem] border border-black/5 bg-[#101A17] p-6 text-cream shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
            <Gamepad2 className="h-4 w-4 text-amber-300" />
            Arcade study run
          </div>
          <h2 className="mt-3 text-3xl font-semibold">One prompt at a time. Build a streak before your brain wanders.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
            This replaces the old trail/forest format. You get one concept clue, one question, and one decision at a time.
          </p>
        </div>
        <button
          type="button"
          onClick={restart}
          className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
        >
          <RotateCcw className="h-4 w-4" />
          Reset run
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-[1.5rem] bg-white/8 p-4">
          <div className="text-sm text-white/60">Progress</div>
          <div className="mt-2 text-3xl font-semibold">{progress}%</div>
        </div>
        <div className="rounded-[1.5rem] bg-white/8 p-4">
          <div className="text-sm text-white/60">Streak</div>
          <div className="mt-2 text-3xl font-semibold">{streak}</div>
        </div>
        <div className="rounded-[1.5rem] bg-white/8 p-4">
          <div className="text-sm text-white/60">Score</div>
          <div className="mt-2 text-3xl font-semibold">{score}</div>
        </div>
        <div className="rounded-[1.5rem] bg-white/8 p-4">
          <div className="flex items-center gap-2 text-sm text-white/60">
            <Timer className="h-4 w-4" />
            Timer
          </div>
          <div className="mt-2 text-3xl font-semibold">{secondsLeft}s</div>
        </div>
      </div>

      {mode === "ready" ? (
        <div className="grid gap-4 rounded-[1.75rem] bg-[#182621] p-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">How it works</div>
            <h3 className="mt-3 text-2xl font-semibold">Fast concept matching, then one boss round.</h3>
            <p className="mt-3 text-sm leading-6 text-white/70">
              Clear the short rounds first, then finish with a boss question that checks whether the main idea actually stuck.
            </p>
            <button
              type="button"
              onClick={start}
              className="mt-5 rounded-full bg-ember px-5 py-3 text-sm font-semibold text-white transition hover:bg-emberDark"
            >
              Start arcade run
            </button>
          </div>
          <div className="rounded-[1.5rem] bg-white/6 p-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
              <Shield className="h-4 w-4 text-lime-300" />
              Run rewards
            </div>
            <div className="mt-3 text-lg font-semibold">Complete the run for {quest.badge}</div>
            <div className="mt-2 text-sm text-white/70">
              Base quest reward {quest.xp} XP, plus arcade score on top for motivation.
            </div>
          </div>
        </div>
      ) : null}

      {mode !== "ready" && round ? (
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[1.75rem] bg-[#182621] p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
              {round.kind === "boss" ? "Boss round" : `Round ${currentIndex + 1}`}
            </div>
            <h3 className="mt-3 text-2xl font-semibold">{round.concept}</h3>
            <div className="mt-4 rounded-[1.5rem] bg-gradient-to-br from-[#f0b27a] via-[#f5f0de] to-[#d5e3c2] p-5 text-ink">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
                <Zap className="h-4 w-4 text-ember" />
                Concept clue
              </div>
              <p className="mt-3 text-lg font-semibold">{round.clue}</p>
            </div>
          </div>

          <div className="rounded-[1.75rem] bg-white/8 p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
              {round.kind === "boss" ? "Final check" : "Choice round"}
            </div>
            <h3 className="mt-3 text-2xl font-semibold">{round.prompt}</h3>
            <div className="mt-5 grid gap-3">
              {round.options.map((option, index) => {
                const isSelected = selected === option;
                const isAnswer = option === round.answer;

                return (
                  <button
                    key={`${round.id}-${index}`}
                    type="button"
                    onClick={() => setSelected(option)}
                    disabled={locked}
                    className={`rounded-[1.25rem] border px-4 py-4 text-left text-sm transition ${
                      locked && isAnswer
                        ? "border-emerald-300 bg-emerald-100 text-emerald-950"
                        : locked && isSelected && !isAnswer
                          ? "border-rose-300 bg-rose-100 text-rose-950"
                          : isSelected
                            ? "border-amber-300 bg-amber-50 text-ink"
                            : "border-white/10 bg-white/5 text-white/85 hover:bg-white/10"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={submit}
                disabled={!selected || locked || mode === "done"}
                className="rounded-full bg-ember px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-white/10"
              >
                Lock answer
              </button>
              <div className="text-sm text-white/70">
                {locked
                  ? selected === round.answer
                    ? `Correct. +${scoreForRound(round)} base points.`
                    : `Not this one. Correct answer: ${round.answer}`
                  : "Pick the option that best fits the uploaded material."}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {mode === "done" ? (
        <div className="rounded-[1.75rem] bg-[#182621] p-6">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Run complete</div>
          <h3 className="mt-3 text-3xl font-semibold">Arcade clear</h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
            You finished the active learning run. Claim the quest reward below, then use the mission list only if you want one more short pass.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-[1.5rem] bg-white/8 p-4">
              <div className="text-sm text-white/60">Final score</div>
              <div className="mt-2 text-3xl font-semibold">{score}</div>
            </div>
            <div className="rounded-[1.5rem] bg-white/8 p-4">
              <div className="text-sm text-white/60">Correct hits</div>
              <div className="mt-2 text-3xl font-semibold">
                {hits}/{rounds.length}
              </div>
            </div>
            <div className="rounded-[1.5rem] bg-white/8 p-4">
              <div className="text-sm text-white/60">Badge track</div>
              <div className="mt-2 text-2xl font-semibold">{quest.badge}</div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
