"use client";

import { ArenaClient } from "../[slug]/arena-client";
import { TipsScope } from "~/components/tips/tips-scope";
import { TipsGlassCard } from "~/components/tips/ui";
import { api } from "~/trpc/react";

export default function TipsArenaLivePage() {
  const live = api.tips.liveMatch.useQuery(undefined, {
    refetchInterval: 15_000,
  });

  if (live.isLoading) {
    return (
      <TipsScope className="flex items-center justify-center">
        <p className="tips-label">Loading live arena…</p>
      </TipsScope>
    );
  }

  if (!live.data) {
    return (
      <TipsScope className="flex items-center justify-center p-8">
        <TipsGlassCard className="max-w-lg text-center">
          <p className="tips-label mb-2">Arena</p>
          <h1 className="tips-display text-4xl">No live match today</h1>
        </TipsGlassCard>
      </TipsScope>
    );
  }

  return <ArenaClient slug={live.data.slug} />;
}
