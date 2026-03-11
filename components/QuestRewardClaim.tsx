"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Gift, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  hasClaimedReward,
  isQuestReadyToClaim,
  readMissionProgress,
  storeEarnedReward
} from "@/lib/clientProgress";
import { StudyQuest } from "@/lib/types";

export function QuestRewardClaim({
  quest,
  persistToServer
}: {
  quest: StudyQuest;
  persistToServer: boolean;
}) {
  const [claimed, setClaimed] = useState(false);
  const [missionProgress, setMissionProgress] = useState<Record<string, boolean>>({});
  const [statusMessage, setStatusMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const scope = `quest-${quest.id}`;
  const router = useRouter();

  useEffect(() => {
    setClaimed(quest.completed || hasClaimedReward(quest.id));
    setMissionProgress(readMissionProgress(scope));
  }, [quest.completed, quest.id, scope]);

  const readyToClaim = useMemo(() => isQuestReadyToClaim(quest, missionProgress), [missionProgress, quest]);

  const claim = () => {
    startTransition(async () => {
      setStatusMessage("");

      try {
        if (persistToServer) {
          const response = await fetch("/api/quests/claim", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ questId: quest.id })
          });

          const payload = (await response.json()) as { error?: string };

          if (!response.ok) {
            throw new Error(payload.error || "Reward claim failed");
          }
        }

        const rewards = storeEarnedReward({
          questId: quest.id,
          courseId: quest.courseId,
          topic: quest.topic,
          badge: quest.badge,
          xp: quest.xp,
          completedAt: new Date().toISOString()
        });

        setClaimed(rewards.some((reward) => reward.questId === quest.id));
        setStatusMessage("Reward claimed. Your rewards page and totals are updated.");
        router.refresh();
      } catch (error) {
        setStatusMessage(error instanceof Error ? error.message : "Reward claim failed");
      }
    });
  };

  return (
    <section className="rounded-[2rem] border border-black/5 bg-cream p-6 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-sand px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-black/55">
            <Gift className="h-4 w-4 text-ember" />
            Reward chest
          </div>
          <h2 className="mt-3 text-3xl font-semibold text-ink">Claim your quest reward</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-black/60">
            Finish the mission checklist, then unlock the badge and XP here so the rewards section actually reflects what you earned.
          </p>
        </div>
        <div className="rounded-[1.5rem] bg-white px-4 py-3 text-right">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">{quest.badge}</div>
          <div className="mt-1 text-2xl font-semibold text-emberDark">+{quest.xp} XP</div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={claim}
          disabled={!readyToClaim || claimed || isPending}
          className="rounded-full bg-ember px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-black/15"
        >
          {claimed ? "Reward claimed" : isPending ? "Claiming reward..." : "Claim reward"}
        </button>
        <div className="inline-flex items-center gap-2 text-sm text-black/60">
          <Trophy className="h-4 w-4 text-amber-500" />
          {readyToClaim
            ? "All missions done. You can unlock this reward now."
            : "Complete the quest missions first, then come back here."}
        </div>
      </div>
      {statusMessage ? <p className="mt-3 text-sm text-black/60">{statusMessage}</p> : null}
    </section>
  );
}
