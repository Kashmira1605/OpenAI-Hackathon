"use client";

import { Mission, StudyQuest } from "@/lib/types";

export type StoredQuestReward = {
  questId: string;
  courseId: string;
  topic: string;
  badge: string;
  xp: number;
  completedAt: string;
};

function rewardsKey() {
  return "study-quest-earned-rewards";
}

function missionKey(scope: string) {
  return `study-quest-missions-${scope}`;
}

export function readEarnedRewards(): StoredQuestReward[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(rewardsKey());

  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as StoredQuestReward[];
  } catch {
    window.localStorage.removeItem(rewardsKey());
    return [];
  }
}

export function storeEarnedReward(reward: StoredQuestReward) {
  const current = readEarnedRewards();
  const next = current.some((item) => item.questId === reward.questId)
    ? current
    : [reward, ...current];
  window.localStorage.setItem(rewardsKey(), JSON.stringify(next));
  return next;
}

export function hasClaimedReward(questId: string) {
  return readEarnedRewards().some((reward) => reward.questId === questId);
}

export function readMissionProgress(scope: string): Record<string, boolean> {
  if (typeof window === "undefined") {
    return {};
  }

  const raw = window.localStorage.getItem(missionKey(scope));

  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    window.localStorage.removeItem(missionKey(scope));
    return {};
  }
}

export function writeMissionProgress(scope: string, progress: Record<string, boolean>) {
  window.localStorage.setItem(missionKey(scope), JSON.stringify(progress));
}

export function missionStorageId(mission: Mission, index: number) {
  return `${mission.title}-${mission.durationMin}-${mission.xp}-${index}`;
}

export function countCompleted(progress: Record<string, boolean>) {
  return Object.values(progress).filter(Boolean).length;
}

export function totalEarnedXp(rewards: StoredQuestReward[]) {
  return rewards.reduce((sum, reward) => sum + reward.xp, 0);
}

export function rewardsToBadges(rewards: StoredQuestReward[]) {
  return rewards.map((reward) => ({
    id: `reward-${reward.questId}`,
    title: reward.badge,
    description: `Earned from completing ${reward.topic}.`,
    earned: true
  }));
}

export function isQuestReadyToClaim(quest: StudyQuest, progress: Record<string, boolean>) {
  return quest.missions.every((mission, index) => progress[missionStorageId(mission, index)]);
}
