"use client";

import { JumboArenaClient } from "./jumbo-arena-client";
import { JumboFrame } from "~/components/tips/jumbo-frame";
import { useI18n } from "~/components/providers/i18n-provider";
import { TipsGlassCard } from "~/components/tips/ui";
import { api } from "~/trpc/react";

export default function TipsJumboPage() {
  const { t } = useI18n();
  const live = api.tips.liveMatch.useQuery(undefined, {
    refetchInterval: 15_000,
  });

  if (live.isLoading) {
    return (
      <JumboFrame className="flex items-center justify-center">
        <p className="tips-label">{t("tipsLoadingLiveArena")}</p>
      </JumboFrame>
    );
  }

  if (!live.data) {
    return (
      <JumboFrame className="flex items-center justify-center p-8">
        <TipsGlassCard className="max-w-lg text-center">
          <p className="tips-label mb-2">{t("tipsArena")}</p>
          <h1 className="tips-display text-4xl">{t("tipsNoMatchToday")}</h1>
        </TipsGlassCard>
      </JumboFrame>
    );
  }

  return <JumboArenaClient slug={live.data.slug} />;
}
