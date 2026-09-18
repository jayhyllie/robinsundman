"use client";

import { CalendarDays, QrCode, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { SidebarShell } from "~/components/layout/shell";
import { useBranding } from "~/components/providers/branding-provider";
import { localized, useI18n } from "~/components/providers/i18n-provider";
import { QrDisplay } from "~/components/quiz/qr-display";
import { TipsBadge, TipsGlassCard, TipsLinkButton } from "~/components/tips/ui";
import { HeroBackground } from "~/components/ui/hero-background";
import { useSocketSession } from "~/hooks/use-socket-session";
import { api } from "~/trpc/react";

export default function ActiveQuizPage() {
  const router = useRouter();
  const { joinBgImageUrl } = useBranding();
  const { t, locale } = useI18n();

  // One-shot discovery of the active session (QR/title). Status updates come
  // from the socket — only keep polling while no live session exists yet.
  const { data: quiz, isLoading } = api.quiz.getActive.useQuery(undefined, {
    refetchInterval: (q) => (q.state.data?.sessions[0] ? false : 10_000),
  });

  const session = quiz?.sessions[0];
  const { state } = useSocketSession({
    sessionId: session?.id ?? "",
    watch: true,
    enabled: !!session?.id,
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const joinUrl = session ? `${appUrl}/quiz/join/${session.joinCode}` : null;
  const status = state?.status ?? session?.status;
  const quizInProgress =
    !!status && status !== "LOBBY" && status !== "COMPLETED";
  const participantCount =
    state?.participantCount ?? session?._count.participants ?? 0;

  useEffect(() => {
    if (state?.status === "COMPLETED") {
      router.replace("/quiz");
    }
  }, [state?.status, router]);

  return (
    <SidebarShell>
      <HeroBackground imageUrl={joinBgImageUrl} />
      <div className="relative z-10 mx-auto flex w-full flex-col gap-6 p-6 py-0">
        {isLoading ? (
          <p className="tips-label">{t("rejoining")}</p>
        ) : !quiz || !session || !joinUrl ? (
          <TipsGlassCard className="py-12 text-center">
            <QrCode className="mx-auto mb-4 h-10 w-10 text-[--tips-muted]" />
            <p className="tips-display text-3xl">{t("noActiveQuizFound")}</p>
            <TipsLinkButton href="/quiz" variant="secondary" className="mt-6 inline-flex">
              {t("home")}
            </TipsLinkButton>
          </TipsGlassCard>
        ) : quizInProgress ? (
          <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 text-center tips-animate-reveal">
            <TipsBadge status="LIVE" liveDot>
              {t("live")}
            </TipsBadge>
            <h1 className="tips-display max-w-5xl text-5xl leading-[0.95] tips-ice-text md:text-7xl lg:text-8xl">
              {t("quizStarted")}
            </h1>
            <p className="tips-display text-4xl tips-gold-text md:text-6xl lg:text-7xl">
              {t("goodLuck")}
            </p>
            <p className="mt-4 max-w-2xl text-lg text-[--tips-muted] md:text-xl">
              {localized(locale, quiz.titleSv, quiz.titleEn)}
            </p>
          </div>
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
                  label={`${participantCount} ${t("participants")}`}
                />
                <InfoChip
                  icon={QrCode}
                  label={`${quiz._count.questions} ${t("questionsCount")}`}
                />
              </div>
            </TipsGlassCard>

            <QrDisplay url={joinUrl} size={600} />
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
    <span className="tips-glass inline-flex items-center gap-2 rounded-[--tips-radius-pill] px-3 py-1.5 text-[11px] font-extrabold tracking-[0.14em] uppercase">
      <Icon className="h-3.5 w-3.5 text-[--tips-club-lime]" />
      {label}
    </span>
  );
}
