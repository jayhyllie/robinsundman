"use client";

import { WinnerRevealClient } from "../../[slug]/winner/winner-reveal-client";
import { TipsScope } from "~/components/tips/tips-scope";
import { TipsGlassCard } from "~/components/tips/ui";
import { api } from "~/trpc/react";

export default function TipsArenaLiveWinnerPage() {
  const live = api.tips.liveMatch.useQuery(undefined, {
    refetchInterval: 10_000,
  });

  if (live.isLoading) {
    return (
      <TipsScope className="flex items-center justify-center">
        <p className="tips-label">Loading…</p>
      </TipsScope>
    );
  }

  if (!live.data) {
    return (
      <TipsScope className="flex items-center justify-center p-8">
        <TipsGlassCard className="max-w-lg text-center">
          <p className="tips-label mb-2">Winner</p>
          <h1 className="tips-display text-4xl">No live match</h1>
          <p className="mt-3 text-sm text-[var(--tips-muted)]">
            No match for today to reveal a winner on.
          </p>
        </TipsGlassCard>
      </TipsScope>
    );
  }

  return <WinnerRevealClient slug={live.data.slug} />;
}
