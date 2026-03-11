"use client";

import { useMemo, useState } from "react";
import { Crown, Flame, Trophy } from "lucide-react";

import { Student } from "@/lib/types";

type LeaderboardEntry = {
  id: string;
  name: string;
  xp: number;
  streak: number;
  badge: string;
  isCurrentUser?: boolean;
};

const weeklyPeers: LeaderboardEntry[] = [
  { id: "peer-1", name: "Ariana", xp: 540, streak: 6, badge: "Study Sprinter" },
  { id: "peer-2", name: "Mateo", xp: 470, streak: 5, badge: "Quiz Climber" },
  { id: "peer-3", name: "Jules", xp: 425, streak: 4, badge: "Mission Keeper" },
  { id: "peer-4", name: "Sana", xp: 390, streak: 3, badge: "Focus Scout" }
];

const allTimePeers: LeaderboardEntry[] = [
  { id: "peer-a", name: "Nina", xp: 1820, streak: 14, badge: "Year Champion" },
  { id: "peer-b", name: "Rohan", xp: 1670, streak: 11, badge: "XP Builder" },
  { id: "peer-c", name: "Luca", xp: 1510, streak: 10, badge: "Consistency Badge" },
  { id: "peer-d", name: "Ava", xp: 1430, streak: 8, badge: "Comeback Hero" }
];

function buildUserEntry(student: Student, mode: "weekly" | "all-time"): LeaderboardEntry {
  return {
    id: student.id,
    name: student.name,
    xp: mode === "weekly" ? Math.max(120, Math.round(student.totalXp * 0.28)) : student.totalXp,
    streak: student.streak,
    badge: mode === "weekly" ? "Weekly Climber" : "Semester Builder",
    isCurrentUser: true
  };
}

export function LeaderboardPanel({ student }: { student: Student }) {
  const [mode, setMode] = useState<"weekly" | "all-time">("weekly");

  const entries = useMemo(() => {
    const peers = mode === "weekly" ? weeklyPeers : allTimePeers;
    return [...peers, buildUserEntry(student, mode)].sort((left, right) => right.xp - left.xp);
  }, [mode, student]);
  const podium = entries.slice(0, 3);
  const currentUserRank = entries.findIndex((entry) => entry.isCurrentUser) + 1;

  return (
    <section className="grid gap-4 rounded-[2rem] border border-black/5 bg-white/70 p-6 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-sand px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-black/55">
            <Trophy className="h-4 w-4 text-ember" />
            Leaderboard
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-ink">Make progress visible</h2>
          <p className="mt-2 text-sm text-black/55">
            Friendly competition works best when it motivates without shaming. This board is light, playful, and easy to ignore on low-energy days.
          </p>
        </div>
        <div className="flex gap-2">
          {[
            { id: "weekly", label: "Weekly" },
            { id: "all-time", label: "All time" }
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setMode(option.id as "weekly" | "all-time")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                mode === option.id ? "bg-ember text-white" : "bg-sand text-black/65 hover:bg-mist"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {podium.map((entry, index) => (
          <div
            key={`podium-${mode}-${entry.id}`}
            className={`rounded-[1.5rem] p-5 ${index === 0 ? "bg-[#243127] text-white" : index === 1 ? "bg-cream" : "bg-sand"}`}
          >
            <div className={`text-xs font-semibold uppercase tracking-[0.18em] ${index === 0 ? "text-white/60" : "text-black/45"}`}>
              {index === 0 ? "Champion" : `Top ${index + 1}`}
            </div>
            <div className="mt-3 flex items-center gap-2 text-xl font-semibold">
              {entry.name}
              {index === 0 ? <Crown className="h-4 w-4 text-amber-300" /> : null}
            </div>
            <div className={`mt-2 text-sm ${index === 0 ? "text-white/70" : "text-black/60"}`}>{entry.badge}</div>
            <div className="mt-4 text-3xl font-semibold">{entry.xp}</div>
            <div className={`text-sm ${index === 0 ? "text-white/70" : "text-black/55"}`}>XP</div>
          </div>
        ))}
      </div>

      <div className="rounded-[1.5rem] bg-cream p-4 text-sm text-black/60">
        Your current rank: <span className="font-semibold text-ink">#{currentUserRank}</span>
      </div>

      <div className="grid gap-3">
        {entries.map((entry, index) => (
          <div
            key={`${mode}-${entry.id}`}
            className={`flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] p-4 ${
              entry.isCurrentUser ? "bg-[#243127] text-white" : "bg-cream"
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                  entry.isCurrentUser ? "bg-white/10 text-white" : "bg-white text-black/65"
                }`}
              >
                #{index + 1}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{entry.name}</span>
                  {index === 0 ? <Crown className="h-4 w-4 text-amber-300" /> : null}
                </div>
                <div className={`mt-1 text-sm ${entry.isCurrentUser ? "text-white/75" : "text-black/55"}`}>{entry.badge}</div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className={`text-xs uppercase tracking-[0.18em] ${entry.isCurrentUser ? "text-white/55" : "text-black/45"}`}>XP</div>
                <div className="text-lg font-semibold">{entry.xp}</div>
              </div>
              <div className="text-right">
                <div className={`inline-flex items-center gap-1 text-xs uppercase tracking-[0.18em] ${entry.isCurrentUser ? "text-white/55" : "text-black/45"}`}>
                  <Flame className="h-3 w-3" />
                  Streak
                </div>
                <div className="text-lg font-semibold">{entry.streak}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
