"use client";

import { useEffect, useState } from "react";
import { Palette } from "lucide-react";

const moods = [
  { id: "calm", label: "Calm" },
  { id: "focus", label: "Focus" },
  { id: "energy", label: "Energy" },
  { id: "cozy", label: "Cozy" }
] as const;

type MoodId = (typeof moods)[number]["id"];

function storageKey() {
  return "study-quest-mood-theme";
}

export function MoodThemePicker() {
  const [mood, setMood] = useState<MoodId>("calm");

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey()) as MoodId | null;
    const nextMood = stored && moods.some((item) => item.id === stored) ? stored : "calm";
    setMood(nextMood);
    document.documentElement.dataset.mood = nextMood;
  }, []);

  const applyMood = (nextMood: MoodId) => {
    setMood(nextMood);
    document.documentElement.dataset.mood = nextMood;
    window.localStorage.setItem(storageKey(), nextMood);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-black/55">
        <Palette className="h-4 w-4 text-ember" />
        Mood
      </div>
      {moods.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => applyMood(item.id)}
          className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
            mood === item.id ? "bg-ember text-white" : "bg-sand text-black/65 hover:bg-mist"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
