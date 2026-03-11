"use client";

import { useEffect, useMemo, useState } from "react";

import { BadgeCard } from "@/components/BadgeCard";
import { readEarnedRewards, rewardsToBadges, totalEarnedXp } from "@/lib/clientProgress";
import { Badge } from "@/lib/types";

export function RewardsVault({
  serverBadges,
  serverClaimedXp
}: {
  serverBadges: Badge[];
  serverClaimedXp: number;
}) {
  const [earnedBadges, setEarnedBadges] = useState<Badge[]>([]);
  const [earnedXp, setEarnedXp] = useState(0);

  useEffect(() => {
    const rewards = readEarnedRewards();
    setEarnedBadges(rewardsToBadges(rewards));
    setEarnedXp(totalEarnedXp(rewards));
  }, []);

  const badges = useMemo(() => {
    const seen = new Set<string>();
    return [...earnedBadges, ...serverBadges].filter((badge) => {
      if (seen.has(badge.title)) {
        return false;
      }
      seen.add(badge.title);
      return true;
    });
  }, [earnedBadges, serverBadges]);

  return (
    <section className="grid gap-4">
      <div className="rounded-[2rem] border border-black/5 bg-white/70 p-6 shadow-card">
        <h2 className="text-2xl font-semibold text-ink">Recently earned in quests</h2>
        <p className="mt-2 text-sm text-black/55">This updates when you claim rewards on the quest page.</p>
        <div className="mt-4 rounded-[1.5rem] bg-cream p-4">
          <div className="text-sm text-black/55">Quest-earned XP claimed</div>
          <div className="mt-2 text-3xl font-semibold text-ink">{Math.max(serverClaimedXp, earnedXp)}</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {badges.map((badge) => (
          <BadgeCard key={badge.id} badge={badge} />
        ))}
      </div>
    </section>
  );
}
