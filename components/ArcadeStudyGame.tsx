"use client";

import { useEffect, useRef, useState } from "react";
import { Clock3, Flag, Gamepad2, Sparkles, Star, Trophy } from "lucide-react";

import { StudyQuest } from "@/lib/types";

type Level = {
  id: string;
  title: string;
  clue: string;
  explanation: string;
  question: string;
  options: string[];
  answer: string;
  blockX: number;
  platformY: number;
};

type Platform = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type Player = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  onGround: boolean;
};

type Mode = "ready" | "play" | "quiz" | "win";

type GameState = {
  mode: Mode;
  player: Player;
  levels: Level[];
  currentLevel: number;
  activeQuizLevel: number | null;
  clearedLevels: number[];
  score: number;
  stars: number;
  timer: number;
  selectedOption: string | null;
  feedback: "idle" | "correct" | "wrong";
  interactionLocked: boolean;
};

const WIDTH = 980;
const HEIGHT = 560;
const WORLD_WIDTH = 2150;
const GROUND_Y = 470;
const GRAVITY = 1800;
const MOVE_SPEED = 300;
const JUMP_FORCE = -700;
const QUIZ_SECONDS = 15;

const DEMO_QUIZ_BANK = [
  {
    question: "Which idea best matches this study block?",
    options: [
      "The main concept from this topic",
      "A fact from a different chapter",
      "An unrelated example",
      "A distractor with similar wording"
    ],
    answer: "The main concept from this topic"
  },
  {
    question: "What should you remember first from this section?",
    options: [
      "The core definition or process",
      "A random side detail",
      "A topic not mentioned here",
      "A joke answer"
    ],
    answer: "The core definition or process"
  },
  {
    question: "Which answer is most likely to show up on a fast concept check?",
    options: [
      "The key term connected to the topic",
      "A sentence from another unit",
      "A misleading opposite idea",
      "An unrelated example"
    ],
    answer: "The key term connected to the topic"
  },
  {
    question: "True or false: this block is testing the main point of the uploaded notes.",
    options: ["True", "False", "Not enough information", "Skip"],
    answer: "True"
  }
];

function buildLevels(quest: StudyQuest): Level[] {
  const count = 4;

  return Array.from({ length: count }).map((_, index) => ({
    id: `${quest.id}-level-${index + 1}`,
    title: quest.cards[index]?.title ?? `${quest.topic} block ${index + 1}`,
    clue: quest.cards[index]?.visualHint ?? `Use the clue from ${quest.topic} to unlock this block.`,
    explanation:
      quest.cards[index]?.explanation ??
      quest.summary ??
      `This block is a quick recall check based on the uploaded notes for ${quest.topic}.`,
    question: quest.quiz[index]?.question ?? DEMO_QUIZ_BANK[index % DEMO_QUIZ_BANK.length].question,
    options:
      quest.quiz[index]?.options?.length === 4
        ? quest.quiz[index].options
        : DEMO_QUIZ_BANK[index % DEMO_QUIZ_BANK.length].options,
    answer: quest.quiz[index]?.answer ?? DEMO_QUIZ_BANK[index % DEMO_QUIZ_BANK.length].answer,
    blockX: 300 + index * 430,
    platformY: [350, 335, 320, 305][index] ?? 350
  }));
}

function buildPlatforms(levels: Level[]): Platform[] {
  const base: Platform[] = [
    { x: 0, y: GROUND_Y, w: WORLD_WIDTH, h: HEIGHT - GROUND_Y },
    { x: 90, y: 390, w: 180, h: 22 }
  ];

  const topicPlatforms = levels.map((level) => ({
    x: level.blockX - 80,
    y: level.platformY,
    w: 210,
    h: 22
  }));

  const helperPlatforms: Platform[] = [
    { x: 430, y: 410, w: 110, h: 18 },
    { x: 560, y: 390, w: 110, h: 18 },
    { x: 690, y: 370, w: 120, h: 18 },
    { x: 860, y: 380, w: 120, h: 18 },
    { x: 980, y: 360, w: 120, h: 18 },
    { x: 1110, y: 340, w: 120, h: 18 },
    { x: 1280, y: 370, w: 120, h: 18 },
    { x: 1410, y: 350, w: 120, h: 18 },
    { x: 1540, y: 330, w: 120, h: 18 }
  ];

  return [...base, ...helperPlatforms, ...topicPlatforms];
}

function initialState(quest: StudyQuest): GameState {
  return {
    mode: "ready",
    player: { x: 80, y: 320, vx: 0, vy: 0, w: 40, h: 48, onGround: false },
    levels: buildLevels(quest),
    currentLevel: 0,
    activeQuizLevel: null,
    clearedLevels: [],
    score: 0,
    stars: 0,
    timer: 150,
    selectedOption: null,
    feedback: "idle",
    interactionLocked: false
  };
}

function rectsOverlap(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function getBlockRect(level: Level) {
  return { x: level.blockX, y: level.platformY - 72, w: 56, h: 56 };
}

function canTriggerBlock(player: Player, level: Level) {
  const blockRect = getBlockRect(level);
  const interactionZone = {
    x: blockRect.x - 36,
    y: blockRect.y - 20,
    w: blockRect.w + 72,
    h: blockRect.h + 44
  };

  return rectsOverlap(player, interactionZone);
}

function updateGame(game: GameState, keys: Record<string, boolean>, dt: number) {
  if (game.mode !== "play") {
    return;
  }

  game.timer = Math.max(0, game.timer - dt);
  if (game.timer === 0) {
    game.mode = "win";
    return;
  }

  const platforms = buildPlatforms(game.levels);
  const player = game.player;
  player.vx = 0;

  if (keys.ArrowLeft || keys.a) {
    player.vx = -MOVE_SPEED;
  }
  if (keys.ArrowRight || keys.d) {
    player.vx = MOVE_SPEED;
  }

  if ((keys.ArrowUp || keys.w || keys[" "]) && player.onGround) {
    player.vy = JUMP_FORCE;
    player.onGround = false;
  }

  player.x += player.vx * dt;
  player.vy += GRAVITY * dt;
  player.y += player.vy * dt;
  player.x = Math.max(0, Math.min(WORLD_WIDTH - player.w, player.x));
  player.onGround = false;

  for (const platform of platforms) {
    const wasAbove = player.y + player.h - player.vy * dt <= platform.y;
    if (rectsOverlap(player, platform) && player.vy >= 0 && wasAbove) {
      player.y = platform.y - player.h;
      player.vy = 0;
      player.onGround = true;
    }
  }

  const level = game.levels[game.currentLevel];
  if (!level) {
    game.mode = "win";
    return;
  }

  const touchingCurrentBlock = canTriggerBlock(player, level);
  if (touchingCurrentBlock && !game.interactionLocked) {
    game.mode = "quiz";
    game.activeQuizLevel = game.currentLevel;
    game.selectedOption = null;
    game.feedback = "idle";
    game.interactionLocked = true;
  }

  if (!touchingCurrentBlock) {
    game.interactionLocked = false;
  }

  if (game.clearedLevels.length === game.levels.length && player.x > WORLD_WIDTH - 180) {
    game.mode = "win";
  }
}

function drawScene(game: GameState, canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  const cameraX = Math.max(0, Math.min(game.player.x - WIDTH * 0.35, WORLD_WIDTH - WIDTH));
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, "#5a5fd8");
  sky.addColorStop(0.45, "#8a6dd9");
  sky.addColorStop(1, "#ffd9a8");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  for (let i = 0; i < 7; i += 1) {
    ctx.fillStyle = "rgba(255,244,227,0.72)";
    ctx.beginPath();
    ctx.arc(120 + i * 150 - cameraX * 0.2, 95 + (i % 2) * 30, 24, 0, Math.PI * 2);
    ctx.arc(145 + i * 150 - cameraX * 0.2, 80 + (i % 2) * 30, 30, 0, Math.PI * 2);
    ctx.arc(175 + i * 150 - cameraX * 0.2, 95 + (i % 2) * 30, 22, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#7b7ae0";
  ctx.fillRect(0, GROUND_Y - 24, WIDTH, HEIGHT - (GROUND_Y - 24));
  ctx.fillStyle = "#334a7d";
  ctx.fillRect(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y);

  buildPlatforms(game.levels).forEach((platform) => {
    ctx.fillStyle = "#b6b6ff";
    ctx.fillRect(platform.x - cameraX, platform.y, platform.w, platform.h);
    ctx.fillStyle = "#5b67b6";
    ctx.fillRect(platform.x - cameraX, platform.y + platform.h - 8, platform.w, 8);
  });

  game.levels.forEach((level, index) => {
    const cleared = game.clearedLevels.includes(index);
    const blockY = level.platformY - 72;

    ctx.fillStyle = cleared ? "#8fe3c8" : "#ff8e72";
    ctx.fillRect(level.blockX - cameraX, blockY, 56, 56);
    ctx.fillStyle = "#20345d";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText("?", level.blockX + 20 - cameraX, blockY + 35);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(`${index + 1}`, level.blockX + 16 - cameraX, level.platformY - 90);
  });

  ctx.fillStyle = "#fef5e9";
  ctx.fillRect(WORLD_WIDTH - 140 - cameraX, GROUND_Y - 118, 10, 120);
  ctx.fillStyle = "#ff7d73";
  ctx.beginPath();
  ctx.moveTo(WORLD_WIDTH - 130 - cameraX, GROUND_Y - 118);
  ctx.lineTo(WORLD_WIDTH - 70 - cameraX, GROUND_Y - 94);
  ctx.lineTo(WORLD_WIDTH - 130 - cameraX, GROUND_Y - 70);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#253360";
  ctx.fillRect(game.player.x - cameraX, game.player.y, game.player.w, game.player.h);
  ctx.fillStyle = "#ffe2c7";
  ctx.fillRect(game.player.x + 8 - cameraX, game.player.y + 8, 24, 20);
  ctx.fillStyle = "#ff9d7f";
  ctx.fillRect(game.player.x + 3 - cameraX, game.player.y + 2, 34, 8);

  ctx.fillStyle = "rgba(23, 28, 56, 0.8)";
  ctx.fillRect(22, 18, 330, 116);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 21px sans-serif";
  ctx.fillText("Lumen Quest", 42, 48);
  ctx.font = "14px sans-serif";
  ctx.fillText(`Levels cleared ${game.clearedLevels.length}/${game.levels.length}`, 42, 76);
  ctx.fillText(`Stars ${game.stars}   Score ${game.score}   Time ${Math.ceil(game.timer)}s`, 42, 100);

  if (game.mode === "ready") {
    ctx.fillStyle = "rgba(23, 28, 56, 0.86)";
    ctx.fillRect(220, 160, 540, 180);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 30px sans-serif";
    ctx.fillText("Start Lumen Quest", 370, 214);
    ctx.font = "16px sans-serif";
    ctx.fillText("Run and jump to each block. Every block launches a 15 second quiz popup.", 250, 257);
    ctx.fillText("Correct answers clear the level and move you closer to the finish flag.", 260, 292);
  }

  if (game.mode === "win") {
    ctx.fillStyle = "rgba(23, 28, 56, 0.88)";
    ctx.fillRect(260, 180, 460, 160);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px sans-serif";
    ctx.fillText("World Clear", 410, 230);
    ctx.font = "16px sans-serif";
    ctx.fillText("You finished the study world and reached the final flag.", 314, 272);
    ctx.fillText(`Final score ${game.score} · Stars ${game.stars}`, 388, 304);
  }
}

export function ArcadeStudyGame({ quest }: { quest: StudyQuest }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<GameState>(initialState(quest));
  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const snapshotRef = useRef("");
  const [, forceRender] = useState(0);
  const [quizCountdown, setQuizCountdown] = useState(QUIZ_SECONDS);
  const state = stateRef.current;
  const level = state.levels[state.currentLevel];
  const activeQuizLevel = state.activeQuizLevel !== null ? state.levels[state.activeQuizLevel] : level;

  useEffect(() => {
    stateRef.current = initialState(quest);
    snapshotRef.current = "";
    setQuizCountdown(QUIZ_SECONDS);
    if (canvasRef.current) {
      drawScene(stateRef.current, canvasRef.current);
    }
    forceRender((value) => value + 1);
  }, [quest]);

  useEffect(() => {
    if (state.mode !== "quiz") {
      setQuizCountdown(QUIZ_SECONDS);
      return;
    }

    setQuizCountdown(QUIZ_SECONDS);
    const timer = window.setInterval(() => {
      setQuizCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          stateRef.current.feedback = "wrong";
          stateRef.current.score = Math.max(0, stateRef.current.score - 15);
          stateRef.current.mode = "play";
          stateRef.current.activeQuizLevel = null;
          forceRender((value) => value + 1);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [state.mode]);

  useEffect(() => {
    const render = () => {
      if (canvasRef.current) {
        drawScene(stateRef.current, canvasRef.current);
      }
    };

    const tick = (time: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = time;
      }

      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.03);
      lastTimeRef.current = time;
      updateGame(stateRef.current, keysRef.current, dt);
      const snapshot = JSON.stringify({
        mode: stateRef.current.mode,
        currentLevel: stateRef.current.currentLevel,
        activeQuizLevel: stateRef.current.activeQuizLevel,
        clearedLevels: stateRef.current.clearedLevels.length,
        score: stateRef.current.score,
        stars: stateRef.current.stars,
        timer: Math.ceil(stateRef.current.timer)
      });
      if (snapshot !== snapshotRef.current) {
        snapshotRef.current = snapshot;
        forceRender((value) => value + 1);
      }
      render();
      frameRef.current = window.requestAnimationFrame(tick);
    };

    frameRef.current = window.requestAnimationFrame(tick);

    const onKeyDown = (event: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "a", "d", "w", " ", "e", "Enter"].includes(event.key)) {
        keysRef.current[event.key] = true;
        if (stateRef.current.mode === "ready" && ["ArrowLeft", "ArrowRight", "ArrowUp", "a", "d", "w", " "].includes(event.key)) {
          stateRef.current.mode = "play";
        }
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      delete keysRef.current[event.key];
    };

    const onCanvasClick = (event: MouseEvent) => {
      if (!canvasRef.current) {
        return;
      }

      const game = stateRef.current;
      if (game.mode !== "play") {
        return;
      }

      const level = game.levels[game.currentLevel];
      if (!level) {
        return;
      }

      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = WIDTH / rect.width;
      const scaleY = HEIGHT / rect.height;
      const clickX = (event.clientX - rect.left) * scaleX;
      const clickY = (event.clientY - rect.top) * scaleY;
      const cameraX = Math.max(0, Math.min(game.player.x - WIDTH * 0.35, WORLD_WIDTH - WIDTH));
      const blockRect = getBlockRect(level);
      const screenRect = {
        x: blockRect.x - cameraX - 18,
        y: blockRect.y - 18,
        w: blockRect.w + 36,
        h: blockRect.h + 36
      };

      if (
        clickX >= screenRect.x &&
        clickX <= screenRect.x + screenRect.w &&
        clickY >= screenRect.y &&
        clickY <= screenRect.y + screenRect.h
      ) {
        game.mode = "quiz";
        game.activeQuizLevel = game.currentLevel;
        game.selectedOption = null;
        game.feedback = "idle";
        snapshotRef.current = "";
        forceRender((value) => value + 1);
      }
    };

    const serialize = () =>
      JSON.stringify({
        coordinate_system: "origin top-left, x right, y down",
        mode: stateRef.current.mode,
        player: {
          x: Math.round(stateRef.current.player.x),
          y: Math.round(stateRef.current.player.y)
        },
        currentLevel: stateRef.current.currentLevel,
        activeQuizLevel: stateRef.current.activeQuizLevel,
        clearedLevels: stateRef.current.clearedLevels,
        score: stateRef.current.score,
        stars: stateRef.current.stars,
        timer: Math.ceil(stateRef.current.timer)
      });

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvasRef.current?.addEventListener("click", onCanvasClick);
    window.render_game_to_text = serialize;
    window.advanceTime = (ms: number) => {
      const steps = Math.max(1, Math.round(ms / (1000 / 60)));
      for (let i = 0; i < steps; i += 1) {
        updateGame(stateRef.current, keysRef.current, 1 / 60);
      }
      render();
      return serialize();
    };

    render();

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvasRef.current?.removeEventListener("click", onCanvasClick);
      delete window.render_game_to_text;
      delete window.advanceTime;
    };
  }, []);

  const start = () => {
    stateRef.current.mode = "play";
    snapshotRef.current = "";
    forceRender((value) => value + 1);
  };

  const restart = () => {
    stateRef.current = initialState(quest);
    snapshotRef.current = "";
    setQuizCountdown(QUIZ_SECONDS);
    if (canvasRef.current) {
      drawScene(stateRef.current, canvasRef.current);
    }
    forceRender((value) => value + 1);
  };

  const answerQuiz = (option: string) => {
    const game = stateRef.current;
    const currentLevel = game.levels[game.currentLevel];
    if (!currentLevel) {
      return;
    }

    game.selectedOption = option;
    const correct = option === currentLevel.answer;
    game.feedback = correct ? "correct" : "wrong";

    if (correct) {
      game.score += 100;
      game.stars += 1;
      if (!game.clearedLevels.includes(game.currentLevel)) {
        game.clearedLevels.push(game.currentLevel);
      }
      game.currentLevel += 1;
      game.activeQuizLevel = null;
      game.mode = game.currentLevel >= game.levels.length ? "win" : "play";
    } else {
      game.score = Math.max(0, game.score - 20);
      game.activeQuizLevel = null;
      game.mode = "play";
    }

    window.setTimeout(() => {
      stateRef.current.selectedOption = null;
      stateRef.current.feedback = "idle";
      forceRender((value) => value + 1);
    }, 450);

    forceRender((value) => value + 1);
  };

  const progress = Math.round((state.clearedLevels.length / Math.max(state.levels.length, 1)) * 100);

  return (
    <section className="grid gap-5 rounded-[2rem] border border-black/5 bg-[#081512] p-6 text-cream shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
            <Gamepad2 className="h-4 w-4 text-amber-300" />
            Study world
          </div>
          <h2 className="mt-3 text-3xl font-semibold">Run to each block, trigger a pop quiz, and clear the level before the countdown ends.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
            Each block is powered by questions generated from the uploaded syllabus or notes, so the studying happens inside the game world.
          </p>
        </div>
        <button
          type="button"
          onClick={restart}
          className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
        >
          <Sparkles className="h-4 w-4" />
          Reset world
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-[1.5rem] bg-white/8 p-4">
          <div className="text-sm text-white/60">World progress</div>
          <div className="mt-2 text-3xl font-semibold">{progress}%</div>
        </div>
        <div className="rounded-[1.5rem] bg-white/8 p-4">
          <div className="text-sm text-white/60">Stars</div>
          <div className="mt-2 flex items-center gap-2 text-3xl font-semibold">
            <Star className="h-6 w-6 text-amber-300" />
            {state.stars}
          </div>
        </div>
        <div className="rounded-[1.5rem] bg-white/8 p-4">
          <div className="text-sm text-white/60">Score</div>
          <div className="mt-2 text-3xl font-semibold">{state.score}</div>
        </div>
        <div className="rounded-[1.5rem] bg-white/8 p-4">
          <div className="text-sm text-white/60">Badge</div>
          <div className="mt-2 flex items-center gap-2 text-lg font-semibold">
            <Trophy className="h-5 w-5 text-amber-300" />
            {quest.badge}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#10221c]">
        <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} className="h-auto w-full bg-transparent" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[1.5rem] bg-white/8 p-5">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Controls</div>
          <div className="mt-3 text-sm leading-7 text-white/75">
            <div>`Arrow keys` or `WASD` to move</div>
            <div>`Space` or `W` to jump</div>
            <div>Reach the question-mark block and the quiz opens automatically</div>
            <div>You can also click the current block directly on the canvas</div>
            <div>Answer before the 15 second timer ends</div>
          </div>
          {state.mode === "ready" ? (
            <button
              type="button"
              onClick={start}
              className="mt-5 rounded-full bg-ember px-5 py-3 text-sm font-semibold text-white transition hover:bg-emberDark"
            >
              Start study world
            </button>
          ) : null}
        </div>

        <div className="rounded-[1.5rem] bg-white/8 p-5">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Current objective</div>
          <div className="mt-3 text-2xl font-semibold">
            {state.mode === "win"
              ? "Reach the finish flag and claim your reward."
              : level
                ? `Level ${state.currentLevel + 1}: ${level.title}`
                : "All levels cleared"}
          </div>
          <div className="mt-3 text-sm leading-6 text-white/75">
            {state.mode === "win"
              ? "The world is cleared. Claim the quest reward below."
              : "Move to the next block, trigger the quiz popup, and answer correctly to unlock the next study level."}
          </div>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white/80">
            <Flag className="h-4 w-4 text-amber-300" />
            Finish at the far-right flag
          </div>
        </div>
      </div>

      {state.mode === "quiz" && activeQuizLevel ? (
        <div className="rounded-[1.75rem] bg-[#182621] p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Popup block quiz</div>
              <h3 className="mt-3 text-2xl font-semibold">{activeQuizLevel.question}</h3>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#274237] px-4 py-2 text-sm font-semibold text-white">
              <Clock3 className="h-4 w-4 text-amber-300" />
              {quizCountdown}s
            </div>
          </div>
          <div className="mt-4 rounded-[1.5rem] bg-gradient-to-br from-[#f0b27a] via-[#f5f0de] to-[#d5e3c2] p-5 text-ink">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">Clue from your uploaded material</div>
            <p className="mt-3 text-lg font-semibold">{activeQuizLevel.clue}</p>
            <p className="mt-4 text-sm leading-6 text-black/70">{activeQuizLevel.explanation}</p>
          </div>
          <div className="mt-5 grid gap-3">
            {activeQuizLevel.options.map((option, index) => (
              <button
                key={`${activeQuizLevel.id}-${index}`}
                type="button"
                onClick={() => answerQuiz(option)}
                className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-4 text-left text-sm text-white/85 transition hover:bg-white/10"
              >
                {option}
              </button>
            ))}
          </div>
          {state.feedback !== "idle" ? (
            <div className="mt-4 text-sm text-white/70">
              {state.feedback === "correct"
                ? "Correct. The level is cleared and the next block is ready."
                : "Wrong answer or timer expired. Re-hit the block and try again."}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
