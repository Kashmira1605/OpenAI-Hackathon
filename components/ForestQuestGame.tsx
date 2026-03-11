"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { StudyQuest } from "@/lib/types";

type Marker = {
  id: string;
  x: number;
  y: number;
  title: string;
  clue: string;
  question: string;
  options: string[];
  answer: string;
};

type GameMode = "ready" | "play" | "checkpoint" | "win";

type GameState = {
  mode: GameMode;
  player: { x: number; y: number; speed: number };
  markers: Marker[];
  currentIndex: number;
  solved: number[];
  prompt: Marker | null;
  wrongAnswerFlash: boolean;
};

const WIDTH = 880;
const HEIGHT = 420;

function markerFromQuest(quest: StudyQuest): Marker[] {
  const count = Math.min(quest.cards.length, Math.max(quest.quiz.length, 1), 4);

  return Array.from({ length: count }).map((_, index) => ({
    id: `${quest.id}-marker-${index}`,
    x: 170 + index * 170,
    y: index % 2 === 0 ? 120 : 270,
    title: quest.cards[index]?.title ?? `Marker ${index + 1}`,
    clue: quest.cards[index]?.visualHint ?? quest.cards[index]?.explanation ?? "Forest clue",
    question: quest.quiz[index]?.question ?? `Checkpoint ${index + 1}`,
    options: quest.quiz[index]?.options ?? ["A", "B", "C", "D"],
    answer: quest.quiz[index]?.answer ?? quest.quiz[index]?.options?.[0] ?? "A"
  }));
}

function initialState(quest: StudyQuest): GameState {
  return {
    mode: "ready",
    player: { x: 70, y: HEIGHT / 2, speed: 180 },
    markers: markerFromQuest(quest),
    currentIndex: 0,
    solved: [],
    prompt: null,
    wrongAnswerFlash: false
  };
}

function draw(state: GameState, canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, "#DCE9D2");
  gradient.addColorStop(1, "#AFC28D");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "#1E2B1F";
  ctx.fillRect(0, HEIGHT - 58, WIDTH, 58);

  ctx.strokeStyle = "#F3E7C9";
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(70, HEIGHT / 2);
  state.markers.forEach((marker) => ctx.lineTo(marker.x, marker.y));
  ctx.lineTo(WIDTH - 85, HEIGHT / 2);
  ctx.stroke();

  state.markers.forEach((marker, index) => {
    const solved = state.solved.includes(index);
    ctx.fillStyle = solved ? "#C65D27" : "#F9F2DE";
    ctx.beginPath();
    ctx.arc(marker.x, marker.y, 28, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = solved ? "#FFFFFF" : "#1E2B1F";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${index + 1}`, marker.x, marker.y + 4);
  });

  ctx.fillStyle = state.solved.length === state.markers.length ? "#F4B942" : "#DDD5BF";
  ctx.fillRect(WIDTH - 110, HEIGHT / 2 - 45, 28, 90);
  ctx.fillStyle = "#243127";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText("Gate", WIDTH - 96, HEIGHT / 2 - 56);

  ctx.fillStyle = state.wrongAnswerFlash ? "#B42318" : "#243127";
  ctx.beginPath();
  ctx.arc(state.player.x, state.player.y, 20, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(state.player.x - 7, state.player.y - 18, 14, 18);

  if (state.mode === "ready") {
    ctx.fillStyle = "rgba(36,49,39,0.72)";
    ctx.fillRect(24, 22, 340, 100);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 22px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Forest Quest", 42, 56);
    ctx.font = "14px sans-serif";
    ctx.fillText("Use arrow keys or WASD to reach each marker.", 42, 82);
    ctx.fillText("Answer the checkpoint to open the next trail.", 42, 104);
  }

  if (state.mode === "win") {
    ctx.fillStyle = "rgba(36,49,39,0.72)";
    ctx.fillRect(220, 130, 430, 140);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText("Forest Cleared", 350, 185);
    ctx.font = "16px sans-serif";
    ctx.fillText("You made it through the topic path and reached the badge gate.", 258, 216);
  }
}

function serializeState(state: GameState) {
  return JSON.stringify({
    coordinate_system: "origin top-left, x right, y down",
    mode: state.mode,
    player: { x: Math.round(state.player.x), y: Math.round(state.player.y) },
    markers: state.markers.map((marker, index) => ({
      id: marker.id,
      x: marker.x,
      y: marker.y,
      solved: state.solved.includes(index),
      active: index === state.currentIndex
    })),
    gate_open: state.solved.length === state.markers.length,
    prompt: state.prompt
      ? {
          markerId: state.prompt.id,
          question: state.prompt.question,
          options: state.prompt.options
        }
      : null
  });
}

export function ForestQuestGame({ quest }: { quest: StudyQuest }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<GameState>(initialState(quest));
  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const [, forceRender] = useState(0);
  const state = stateRef.current;

  const currentPrompt = state.prompt;
  const forestSummary = useMemo(
    () => `${quest.cards.length} clues, ${quest.quiz.length} checkpoints, ${quest.xp} XP behind the gate.`,
    [quest.cards.length, quest.quiz.length, quest.xp]
  );

  useEffect(() => {
    stateRef.current = initialState(quest);
    const canvas = canvasRef.current;

    if (canvas) {
      draw(stateRef.current, canvas);
    }

    forceRender((count) => count + 1);
  }, [quest]);

  useEffect(() => {
    const update = (dtSeconds: number) => {
      const game = stateRef.current;

      if (game.mode !== "play") {
        return;
      }

      const speed = game.player.speed * dtSeconds;

      if (keysRef.current.ArrowUp || keysRef.current.w) game.player.y -= speed;
      if (keysRef.current.ArrowDown || keysRef.current.s) game.player.y += speed;
      if (keysRef.current.ArrowLeft || keysRef.current.a) game.player.x -= speed;
      if (keysRef.current.ArrowRight || keysRef.current.d) game.player.x += speed;

      game.player.x = Math.max(28, Math.min(WIDTH - 28, game.player.x));
      game.player.y = Math.max(28, Math.min(HEIGHT - 28, game.player.y));

      const activeMarker = game.markers[game.currentIndex];

      if (activeMarker) {
        const dx = game.player.x - activeMarker.x;
        const dy = game.player.y - activeMarker.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 34) {
          game.mode = "checkpoint";
          game.prompt = activeMarker;
          forceRender((count) => count + 1);
        }
      } else if (game.solved.length === game.markers.length && game.player.x >= WIDTH - 125) {
        game.mode = "win";
        forceRender((count) => count + 1);
      }
    };

    const render = () => {
      const canvas = canvasRef.current;

      if (canvas) {
        draw(stateRef.current, canvas);
      }
    };

    const tick = (time: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = time;
      }

      const delta = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      update(Math.min(delta, 0.03));
      render();
      frameRef.current = window.requestAnimationFrame(tick);
    };

    frameRef.current = window.requestAnimationFrame(tick);

    const onKeyDown = (event: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"].includes(event.key)) {
        keysRef.current[event.key] = true;
        if (stateRef.current.mode === "ready") {
          stateRef.current.mode = "play";
        }
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      delete keysRef.current[event.key];
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.render_game_to_text = () => serializeState(stateRef.current);
    window.advanceTime = (ms: number) => {
      const steps = Math.max(1, Math.round(ms / (1000 / 60)));

      for (let i = 0; i < steps; i += 1) {
        update(1 / 60);
      }

      render();
      return serializeState(stateRef.current);
    };

    render();

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }

      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      delete window.render_game_to_text;
      delete window.advanceTime;
    };
  }, []);

  const answerPrompt = (option: string) => {
    const game = stateRef.current;

    if (!game.prompt) {
      return;
    }

    const markerIndex = game.markers.findIndex((marker) => marker.id === game.prompt?.id);

    if (option === game.prompt.answer) {
      if (!game.solved.includes(markerIndex)) {
        game.solved.push(markerIndex);
      }

      game.currentIndex += 1;
      game.prompt = null;
      game.mode = "play";
      game.wrongAnswerFlash = false;
      forceRender((count) => count + 1);
      return;
    }

    game.wrongAnswerFlash = true;
    forceRender((count) => count + 1);
    window.setTimeout(() => {
      stateRef.current.wrongAnswerFlash = false;
      forceRender((count) => count + 1);
    }, 450);
  };

  const restart = () => {
    stateRef.current = initialState(quest);
    forceRender((count) => count + 1);
    const canvas = canvasRef.current;
    if (canvas) draw(stateRef.current, canvas);
  };

  return (
    <section className="grid gap-6 rounded-[2rem] border border-black/5 bg-[#F4EFE3] p-6 shadow-card">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="inline-flex rounded-full bg-[#243127] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#E8F0D7]">
            Topic game
          </div>
          <h2 className="mt-3 text-3xl font-semibold text-ink">Forest Quest</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-black/60">
            Move through the forest, reach each marker, and answer the checkpoint tied to this topic. This turns the uploaded material into a short playable route instead of a passive notes screen.
          </p>
        </div>
        <div className="rounded-[1.5rem] bg-white p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-black/45">Quest brief</div>
          <p className="mt-3 text-sm leading-6 text-black/65">{forestSummary}</p>
          <p className="mt-3 text-sm leading-6 text-black/65">
            Controls: use `WASD` or arrow keys. Reach the glowing marker, clear the checkpoint, then head for the gate.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.75rem] bg-[#DCE9D2] p-4">
          <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} className="w-full rounded-[1.25rem] bg-[#DCE9D2]" />
        </div>

        <div className="grid gap-4">
          <div className="rounded-[1.75rem] bg-white p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-black/45">Trail state</div>
            <div className="mt-3 text-lg font-semibold text-ink">
              {state.mode === "win"
                ? "Gate cleared"
                : currentPrompt
                  ? `Checkpoint: ${currentPrompt.title}`
                  : state.mode === "play"
                    ? "Explore the next marker"
                    : "Press a movement key to begin"}
            </div>
            <p className="mt-3 text-sm leading-6 text-black/60">
              {currentPrompt
                ? currentPrompt.clue
                : quest.cards[Math.min(state.currentIndex, Math.max(quest.cards.length - 1, 0))]?.explanation || quest.summary}
            </p>
          </div>

          {currentPrompt ? (
            <div className="rounded-[1.75rem] bg-[#243127] p-5 text-white">
              <div className="text-xs uppercase tracking-[0.18em] text-white/60">Checkpoint challenge</div>
              <p className="mt-3 text-lg font-semibold">{currentPrompt.question}</p>
              <div className="mt-4 grid gap-2">
                {currentPrompt.options.map((option, optionIndex) => (
                  <button
                    key={`${currentPrompt.id}-${optionIndex}`}
                    type="button"
                    onClick={() => answerPrompt(option)}
                    className="rounded-2xl bg-white/10 px-4 py-3 text-left text-sm transition hover:bg-white/16"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-[1.75rem] bg-white p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-black/45">Progress</div>
            <div className="mt-3 text-lg font-semibold text-ink">
              {state.solved.length}/{state.markers.length} markers solved
            </div>
            <button
              type="button"
              onClick={restart}
              className="mt-4 rounded-full bg-ember px-4 py-3 text-sm font-semibold text-white transition hover:bg-emberDark"
            >
              Restart forest run
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
