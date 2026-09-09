"use client";

import { WinnerRevealClient } from "../../[slug]/winner/winner-reveal-client";
import { useI18n } from "~/components/providers/i18n-provider";
import { TipsScope } from "~/components/tips/tips-scope";
import { TipsGlassCard } from "~/components/tips/ui";
import { api } from "~/trpc/react";

export default function TipsArenaLiveWinnerPage() {
  const { t } = useI18n();
  const live = api.tips.liveMatch.useQuery(undefined, {
    refetchInterval: 10_000,
  });

  if (live.isLoading) {
    return (
      <TipsScope className="flex items-center justify-center">
        <p className="tips-label">{t("loading")}</p>
      </TipsScope>
    );
  }

  if (!live.data) {
    return (
      <TipsScope className="flex items-center justify-center p-8">
        <TipsGlassCard className="max-w-lg text-center">
          <p className="tips-label mb-2">{t("tipsWinner")}</p>
          <h1 className="tips-display text-4xl">{t("tipsNoLiveMatch")}</h1>
          <p className="mt-3 text-sm text-[--tips-muted]">
            {t("tipsNoMatchForWinner")}
          </p>
        </TipsGlassCard>
      </TipsScope>
    );
  }

  return <WinnerRevealClient slug={live.data.slug} />;
}
