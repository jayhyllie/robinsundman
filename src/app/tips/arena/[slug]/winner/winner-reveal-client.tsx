"use client";

import { useI18n } from "~/components/providers/i18n-provider";
import { TipsScope } from "~/components/tips/tips-scope";
import {
  SponsorFooterLockup,
  TeamCrest,
  TipsBadge,
  TipsGlassCard,
} from "~/components/tips/ui";
import { api } from "~/trpc/react";

export function WinnerRevealClient({ slug }: { slug: string }) {
  const { t } = useI18n();
  const query = api.tips.winnerBySlug.useQuery(
    { slug },
    { refetchInterval: 5_000 },
  );
  const match = query.data;

  if (!match) {
    return (
      <TipsScope className="flex items-center justify-center">
        <p className="tips-label">{t("loading")}</p>
      </TipsScope>
    );
  }

  const winner = match.winner;

  return (
    <TipsScope className="flex min-h-svh flex-col items-center justify-center px-6 py-10 text-center">
      <div className="tips-animate-reveal flex w-full max-w-4xl flex-col items-center gap-8">
        <TipsBadge status="WINNER_PICKED">{t("tipsTonightsWinner")}</TipsBadge>

        <div className="flex items-center gap-4">
          <TeamCrest
            name={match.homeTeam.name}
            logoUrl={match.homeTeam.logoUrl}
            size="md"
          />
          <span className="tips-display text-2xl text-[var(--tips-muted)]">
            {match.homeTeam.shortName} {t("tipsVs")} {match.awayTeam.shortName}
          </span>
          <TeamCrest
            name={match.awayTeam.name}
            logoUrl={match.awayTeam.logoUrl}
            size="md"
          />
        </div>

        {winner ? (
          <>
            <h1 className="tips-display tips-animate-glow rounded-[var(--tips-radius-lg)] px-8 py-4 text-6xl tips-gold-text md:text-8xl">
              {winner.prediction.playerName}
            </h1>

            <TipsGlassCard className="w-full max-w-lg tips-animate-glow">
              <p className="tips-label mb-2 !text-[var(--tips-trophy-gold)]">
                {t("tipsPredictedExactScore")}
              </p>
              <p className="tips-display text-7xl tips-ice-text md:text-8xl">
                {winner.prediction.homeGoals}–{winner.prediction.awayGoals}
              </p>
              {match.homeScore != null && match.awayScore != null ? (
                <p className="mt-3 text-sm text-[var(--tips-muted)]">
                  {t("tipsFinalResult")} {match.homeScore}–{match.awayScore}
                </p>
              ) : null}
            </TipsGlassCard>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--tips-muted)]">
              <span>
                <span className="tips-ice-text font-bold tabular-nums">
                  {match.predictionCount.toLocaleString("sv-SE")}
                </span>{" "}
                {t("tipsTipsCount")}
              </span>
              <span className="text-[var(--tips-glass-border)]">·</span>
              <span>{t("tipsExactScoreDraw")}</span>
            </div>
          </>
        ) : (
          <TipsGlassCard className="w-full max-w-lg">
            <p className="tips-display text-4xl">{t("tipsWaitingForDraw")}</p>
            <p className="mt-3 text-sm text-[var(--tips-muted)]">
              {t("tipsWinnerWillAppear")}
            </p>
          </TipsGlassCard>
        )}

        {match.sponsor ? (
          <SponsorFooterLockup
            name={match.sponsor.name}
            logoUrl={match.sponsor.logoUrl}
          />
        ) : null}
      </div>
    </TipsScope>
  );
}
