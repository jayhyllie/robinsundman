"use client";

import { CalendarDays, QrCode, Users } from "lucide-react";

import { SidebarShell } from "~/components/layout/shell";
import { useBranding } from "~/components/providers/branding-provider";
import { localized, useI18n } from "~/components/providers/i18n-provider";
import { QrDisplay } from "~/components/quiz/qr-display";
import { TipsBadge, TipsGlassCard, TipsLinkButton } from "~/components/tips/ui";
import { HeroBackground } from "~/components/ui/hero-background";
import { api } from "~/trpc/react";

export default function ActiveQuizPage() {
  const { joinBgImageUrl } = useBranding();
  const { t, locale } = useI18n();
  const { data: quiz, isLoading } = api.quiz.getActive.useQuery(undefined, {
    refetchInterval: 10_000,
  });

  const session = quiz?.sessions[0];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const joinUrl = session ? `${appUrl}/quiz/join/${session.joinCode}` : null;

  return (
    <SidebarShell>
      <HeroBackground imageUrl={joinBgImageUrl} />
      <div className="relative z-10 mx-auto flex w-full flex-col gap-6 p-6 py-0">
        {isLoading ? (
          <p className="tips-label">{t("rejoining")}</p>
        ) : !quiz || !session || !joinUrl ? (
          <TipsGlassCard className="py-12 text-center">
            <QrCode className="mx-auto mb-4 h-10 w-10 text-[var(--tips-muted)]" />
            <p className="tips-display text-3xl">{t("noActiveQuizFound")}</p>
            <TipsLinkButton href="/quiz" variant="secondary" className="mt-6 inline-flex">
              {t("home")}
            </TipsLinkButton>
          </TipsGlassCard>
        ) : (
          <div className="grid gap-6 tips-animate-reveal">
            <TipsGlassCard className="space-y-4">
              <TipsBadge status="LIVE" liveDot>
                {t("live")}
              </TipsBadge>
              <h1 className="tips-display text-4xl md:text-5xl">
                {localized(locale, quiz.titleSv, quiz.titleEn)}
              </h1>
              <div className="flex flex-wrap gap-3">
                {quiz.matchNumber != null && (
                  <InfoChip
                    icon={CalendarDays}
                    label={`${t("match")} ${quiz.matchNumber}`}
                  />
                )}
                <InfoChip
                  icon={Users}
                  label={`${session._count.participants} ${t("participants")}`}
                />
                <InfoChip
                  icon={QrCode}
                  label={`${quiz._count.questions} ${t("questionsCount")}`}
                />
              </div>
              <div className="pt-2">
                <p className="tips-label mb-2">{t("joinCode")}</p>
                <p className="tips-display text-5xl tracking-[0.2em] tips-gold-text sm:text-6xl">
                  {session.joinCode}
                </p>
              </div>
            </TipsGlassCard>

            <QrDisplay url={joinUrl} size={480} />
          </div>
        )}
      </div>
    </SidebarShell>
  );
}

function InfoChip({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <span className="tips-glass inline-flex items-center gap-2 rounded-[var(--tips-radius-pill)] px-3 py-1.5 text-[11px] font-extrabold tracking-[0.14em] uppercase">
      <Icon className="h-3.5 w-3.5 text-[var(--tips-club-lime)]" />
      {label}
    </span>
  );
}
