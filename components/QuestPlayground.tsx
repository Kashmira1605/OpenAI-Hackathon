"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Compass, RotateCcw, Sparkles, Trees, Trophy } from "lucide-react";

import { StudyQuest } from "@/lib/types";

function cardAccent(index: number) {
  return ["#C65D27", "#D98B4F", "#5B6C4F", "#7A8E6B", "#A14C25"][index % 5];
}

export function QuestPlayground({ quest }: { quest: StudyQuest }) {
  const [activeCard, setActiveCard] = useState(0);
  const [revealedCards, setRevealedCards] = useState<number[]>([0]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [checkedAnswers, setCheckedAnswers] = useState<Record<number, boolean>>({});

  const correctCount = useMemo(
    () =>
      quest.quiz.reduce((count, question, index) => {
        if (!checkedAnswers[index]) {
          return count;
        }

        return selectedAnswers[index] === question.answer ? count + 1 : count;
      }, 0),
    [checkedAnswers, quest.quiz, selectedAnswers]
  );

  const cardsProgress = Math.round((revealedCards.length / Math.max(quest.cards.length, 1)) * 100);
  const quizProgress = Math.round((Object.keys(checkedAnswers).length / Math.max(quest.quiz.length, 1)) * 100);
  const totalProgress = Math.round((cardsProgress + quizProgress) / 2);

  const revealCard = (index: number) => {
    setActiveCard(index);
    setRevealedCards((current) => (current.includes(index) ? current : [...current, index]));
  };

  const submitAnswer = (index: number) => {
    if (!selectedAnswers[index]) {
      return;
    }

    setCheckedAnswers((current) => ({
      ...current,
      [index]: true
    }));
  };

  const resetRun = () => {
    setActiveCard(0);
    setRevealedCards([0]);
    setSelectedAnswers({});
    setCheckedAnswers({});
  };

  return (
    <section className="grid gap-6 rounded-[2rem] border border-black/5 bg-[#203127] p-6 text-cream shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
            <Trees className="h-4 w-4 text-lime-300" />
            Forest quest
          </div>
          <h2 className="mt-3 text-3xl font-semibold">Forest run: clear one learning trail at a time</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
            Each concept is a trail marker. Unlock the path, answer checkpoints, and reach the badge at the forest gate.
          </p>
        </div>
        <button
          type="button"
          onClick={resetRun}
          className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
        >
          <RotateCcw className="h-4 w-4" />
          Restart run
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.5rem] bg-white/8 p-4">
          <div className="text-sm text-white/65">Trail progress</div>
          <div className="mt-2 text-3xl font-semibold">{totalProgress}%</div>
        </div>
        <div className="rounded-[1.5rem] bg-white/8 p-4">
          <div className="text-sm text-white/65">Markers unlocked</div>
          <div className="mt-2 text-3xl font-semibold">
            {revealedCards.length}/{quest.cards.length}
          </div>
        </div>
        <div className="rounded-[1.5rem] bg-white/8 p-4">
          <div className="text-sm text-white/65">Checkpoint score</div>
          <div className="mt-2 text-3xl font-semibold">
            {correctCount}/{quest.quiz.length}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="grid gap-4">
          <div className="rounded-[1.75rem] bg-white/8 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Trail marker</div>
                <h3 className="mt-2 text-2xl font-semibold">{quest.cards[activeCard]?.title}</h3>
              </div>
              <div className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white/75">
                Marker {activeCard + 1}
              </div>
            </div>
            <div
              className="rounded-[1.5rem] p-5 text-ink"
              style={{ background: `linear-gradient(135deg, ${cardAccent(activeCard)} 0%, #F5F3E8 55%, #D5E3C2 100%)` }}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-black/55">
                Forest clue
              </p>
              <p className="mt-3 text-lg font-semibold">{quest.cards[activeCard]?.visualHint}</p>
              <p className="mt-4 text-sm leading-6 text-black/70">{quest.cards[activeCard]?.explanation}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {quest.cards.map((card, index) => (
                <button
                  key={`${card.title}-${index}`}
                  type="button"
                  onClick={() => revealCard(index)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    index === activeCard
                      ? "bg-ember text-white"
                      : revealedCards.includes(index)
                        ? "bg-white/15 text-white"
                        : "bg-white/8 text-white/70 hover:bg-white/12"
                  }`}
                >
                  {revealedCards.includes(index) ? "Camp reached" : "Scout"} {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {quest.quiz.map((item, index) => {
            const selected = selectedAnswers[index];
            const checked = checkedAnswers[index];
            const correct = selected === item.answer;

            return (
              <div key={`${item.question}-${index}`} className="rounded-[1.75rem] bg-white/8 p-5">
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                  Forest checkpoint {index + 1}
                </div>
                <p className="text-lg font-semibold">{item.question}</p>
                <div className="mt-4 grid gap-2">
                  {item.options.map((option) => {
                    const isSelected = selected === option;
                    const isAnswer = option === item.answer;

                    return (
                      <button
                        key={`${option}-${index}`}
                        type="button"
                        disabled={checked}
                        onClick={() =>
                          setSelectedAnswers((current) => ({
                            ...current,
                            [index]: option
                          }))
                        }
                        className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                          checked && isAnswer
                            ? "border-emerald-300 bg-emerald-100 text-emerald-950"
                            : checked && isSelected && !isAnswer
                              ? "border-rose-300 bg-rose-100 text-rose-950"
                              : isSelected
                                ? "border-amber-300 bg-amber-50 text-ink"
                                : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => submitAnswer(index)}
                    disabled={checked || !selected}
                    className="rounded-full bg-ember px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-white/10"
                  >
                    Cross checkpoint
                  </button>
                  {checked ? (
                    <div className="inline-flex items-center gap-2 text-sm font-semibold">
                      {correct ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                          Correct
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 text-amber-300" />
                          Correct answer: {item.answer}
                        </>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-[1.75rem] bg-white/8 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">XP payout</div>
            <div className="mt-2 text-2xl font-semibold">
              {quest.xp + correctCount * 10} XP potential
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white/80">
            <Trophy className="h-4 w-4 text-amber-300" />
            {quest.badge}
          </div>
        </div>
        <div className="mt-4 rounded-[1.5rem] bg-[#2C4936] p-4 text-sm text-white/80">
          <div className="mb-2 inline-flex items-center gap-2 font-semibold text-lime-200">
            <Compass className="h-4 w-4" />
            Forest route
          </div>
          <p>
            Start at the first marker, unlock each clue, then clear the checkpoints in order. This turns the notes into a path you can actually move through.
          </p>
        </div>
      </div>
    </section>
  );
}
