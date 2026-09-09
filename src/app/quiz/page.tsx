"use client";

import { useEffect } from "react";
import { ChevronRight, Clock, SquareStar, Users, UserStar } from "lucide-react";

import { CompanyLeaderboard, Leaderboard } from "~/components/quiz/leaderboard";
import { SidebarShell } from "~/components/layout/shell";
import { useI18n } from "~/components/providers/i18n-provider";
import { useBranding } from "~/components/providers/branding-provider";
import { HeroBackground } from "~/components/ui/hero-background";
import { TipsGlassCard, TipsLinkButton } from "~/components/tips/ui";
import { NextMatchWidget } from "~/components/ui/next-match-widget";
import { AppTitle } from "~/components/ui/logo";
import { api } from "~/trpc/react";

export default function HomePage() {
  const { t, locale } = useI18n();
  const { homeBgImageUrl } = useBranding();
  const utils = api.useUtils();
  const ensureDefaults = api.leaderboard.ensureDefaultsPublic.useMutation({
    onSuccess: () => void utils.leaderboard.getActivePeriods.invalidate(),
  });

  const { data: periods } = api.leaderboard.getActivePeriods.useQuery();
  const { data: latestMatch } = api.leaderboard.getLatestMatchPodium.useQuery();
  const { data: activeQuiz } = api.quiz.getActive.useQuery();

  useEffect(() => {
    if (periods?.length === 0) {
      ensureDefaults.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periods?.length]);

  const seasonPeriod = periods?.find((p) => p.type === "SEASON");
  const monthlyPeriod = periods?.find((p) => p.type === "MONTHLY");

  const seasonEntries =
    seasonPeriod?.companyScores.map((s, i) => ({
      rank: i + 1,
      name: s.company.name,
      points: s.points,
    })) ?? [];

  const monthlyEntries =
    monthlyPeriod?.companyScores.map((s, i) => ({
      rank: i + 1,
      name: s.company.name,
      points: s.points,
    })) ?? [];

  const mvpEntries =
    monthlyPeriod?.playerScores.map((s, i) => ({
      rank: i + 1,
      id: s.id,
      name: s.playerName,
      company: s.company.name,
      points: s.points,
      initials: s.playerName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
    })) ?? [];

  return (
    <SidebarShell>
      <div className="relative isolate min-h-full">
        <HeroBackground imageUrl={homeBgImageUrl} />

        <div className="relative z-10 grid gap-6 px-6">
        <div className="flex flex-col gap-6 border-b border-[--tips-glass-border] px-6 py-2 md:py-4 lg:flex-row lg:items-end lg:justify-between lg:py-8">
          <AppTitle subtitle={t("questionsInfo")} align="left" />
          <TipsGlassCard className="flex flex-col gap-3 p-4">
            <section className="flex items-center gap-2 text-lg">
              <Users className="h-6 w-6 text-[--tips-club-lime]" />
              0 {t("online")}
            </section>
            <div className="h-px bg-[--tips-glass-border]" />
            {activeQuiz ? (
              <TipsLinkButton href="/quiz/live" variant="gold" size="lg" className="w-full">
                {t("playQuiz")} <ChevronRight className="h-4 w-4" />
              </TipsLinkButton>
            ) : (
              <p className="text-sm text-[--tips-muted]">{t("noActiveQuizFound")}</p>
            )}
          </TipsGlassCard>
        </div>

        <div className="grid gap-4 md:grid-cols-6">
          <CompanyLeaderboard
            title={t("seasonLeague")}
            entries={seasonEntries}
            viewAllHref="/quiz/leaderboard"
            limit={5}
            className="md:col-span-2"
          />
          <CompanyLeaderboard
            title={t("monthlyLeague")}
            entries={monthlyEntries}
            viewAllHref="/quiz/leaderboard"
            limit={5}
            className="md:col-span-2"
          />
          <Leaderboard
            title={t("monthlyMvp")}
            entries={mvpEntries}
            viewAllHref="/quiz/leaderboard"
            limit={5}
            compact
            className="md:col-span-2"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-layout-md lg:grid-cols-layout-lg gap-4">
          <TipsGlassCard className="relative">
            <p className="tips-label mb-4">{t("latestMatch")}</p>
            <div className="flex flex-col items-center gap-4 py-4">
              {latestMatch?.podium && latestMatch.podium.length > 0 ? (
                <>
                  <div className="flex items-end justify-center gap-4">
                    {latestMatch.podium[0] && (
                      <div className="flex flex-col items-center text-center">
                        <div className="tips-display flex h-16 w-16 items-center justify-center rounded-full border-2 border-[--tips-trophy-gold] bg-[rgba(255,215,0,0.1)] text-xl tips-gold-text">
                          1
                        </div>
                        <p className="mt-2 text-lg font-extrabold">
                          {latestMatch.podium[0].name}
                        </p>
                        <p className="text-sm text-[--tips-muted]">
                          {latestMatch.podium[0].company}
                        </p>
                        <p className="tips-display text-xl text-[--tips-muted]">
                          {latestMatch.podium[0].points}
                        </p>
                      </div>
                    )}
                    {latestMatch.podium[1] && (
                      <div className="flex flex-col items-center text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[--tips-glass-border] text-sm font-bold">
                          2
                        </div>
                        <p className="mt-2 text-lg font-extrabold">
                          {latestMatch.podium[1].name}
                        </p>
                        <p className="text-sm text-[--tips-muted]">
                          {latestMatch.podium[1].company}
                        </p>
                        <p className="tips-display text-xl text-[--tips-muted]">
                          {latestMatch.podium[1].points}
                        </p>
                      </div>
                    )}
                    {latestMatch.podium[2] && (
                      <div className="flex flex-col items-center text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[--tips-club-orange] text-sm font-bold">
                          3
                        </div>
                        <p className="mt-2 text-lg font-extrabold">
                          {latestMatch.podium[2].name}
                        </p>
                        <p className="text-sm text-[--tips-muted]">
                          {latestMatch.podium[2].company}
                        </p>
                        <p className="tips-display text-xl text-[--tips-muted]">
                          {latestMatch.podium[2].points}
                        </p>
                      </div>
                    )}
                  </div>
                  {latestMatch.sessionId && (
                    <TipsLinkButton
                      variant="secondary"
                      size="sm"
                      href={`/quiz/leaderboard/${latestMatch.sessionId}`}
                      className="absolute bottom-4 left-1/2 -translate-x-1/2"
                    >
                      {t("viewAllParticipants")}
                      {latestMatch.participantCount ? ` (${latestMatch.participantCount})` : ""}
                    </TipsLinkButton>
                  )}
                </>
              ) : (
                <p className="text-sm text-[--tips-muted]">{t("noData")}</p>
              )}
            </div>
          </TipsGlassCard>

          <TipsGlassCard>
            <p className="tips-label mb-4">{t("howItWorks")}</p>
            <div className="space-y-4 text-sm">
              <div className="flex gap-3">
                <Clock className="h-5 w-5 shrink-0 text-[--tips-club-lime]" />
                <span>{t("tenSeconds")}</span>
              </div>
              <div className="flex gap-3">
                <UserStar className="h-5 w-5 shrink-0 text-[--tips-club-lime]" />
                <span>{t("speedPoints")}</span>
              </div>
              <div className="flex gap-3">
                <SquareStar className="h-5 w-5 shrink-0 text-[--tips-club-lime]" />
                <span>{t("companyPoints")}</span>
              </div>
            </div>
          </TipsGlassCard>

          <NextMatchWidget variant="promo" className="glass-card" />
        </div>
        </div>
      </div>
    </SidebarShell>
  );
}
