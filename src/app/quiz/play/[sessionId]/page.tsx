"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarDays, Users } from "lucide-react";

import { AnswerGrid } from "~/components/quiz/answer-grid";
import { Leaderboard } from "~/components/quiz/leaderboard";
import { QuizTimer } from "~/components/quiz/timer";
import { MobileShell } from "~/components/layout/shell";
import { localized, useI18n } from "~/components/providers/i18n-provider";
import { useBranding } from "~/components/providers/branding-provider";
import { AppFooter } from "~/components/ui/footer";
import { HeroBackground } from "~/components/ui/hero-background";
import { OikLogo } from "~/components/ui/logo";
import { TipsBadge, TipsGlassCard } from "~/components/tips/ui";
import { useSocketSession } from "~/hooks/use-socket-session";
import { api } from "~/trpc/react";

function HeaderPill({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <span className="tips-glass flex items-center gap-1.5 rounded-[--tips-radius-pill] px-2.5 py-1 text-[11px] font-extrabold tracking-[0.14em] text-[--tips-rink-white] uppercase">
      <Icon className="h-3 w-3 text-[--tips-club-lime]" />
      {children}
    </span>
  );
}

export default function PlayPage() {
  const params = useParams<{ sessionId: string }>();
  const { t, locale } = useI18n();
  const { quizBgImageUrl } = useBranding();
  const router = useRouter();
  const sessionId = params.sessionId;

  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [hasAnswered, setHasAnswered] = useState(false);
  const [myScore, setMyScore] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem(`oik-token-${sessionId}`);
    setSessionToken(token);
  }, [sessionId]);

  const { data: participant } = api.participant.getByToken.useQuery(
    { sessionToken: sessionToken ?? "" },
    { enabled: !!sessionToken },
  );

  const { state, connected, submitAnswer } = useSocketSession({
    sessionId,
    sessionToken: sessionToken ?? undefined,
    enabled: !!sessionToken,
  });

  useEffect(() => {
    if (participant) setMyScore(participant.totalScore);
  }, [participant]);

  useEffect(() => {
    setHasAnswered(false);
    setSelectedOptionId(null);
    setTextAnswer("");
  }, [state?.currentQuestion?.quizQuestionId]);

  useEffect(() => {
    if (state && participant) {
      const myEntry = state.leaderboard.find((e) => e.id === participant.id);
      if (myEntry) setMyScore(myEntry.points);
    }
  }, [state, participant]);

  const handleSelectOption = (optionId: string) => {
    if (hasAnswered || state?.status !== "QUESTION_ACTIVE") return;
    setSelectedOptionId(optionId);
    setHasAnswered(true);
    if (state?.currentQuestion) {
      submitAnswer({
        quizQuestionId: state.currentQuestion.quizQuestionId,
        optionId,
      });
    }
  };

  const handleSubmitText = () => {
    if (hasAnswered || !textAnswer.trim() || state?.status !== "QUESTION_ACTIVE")
      return;
    setHasAnswered(true);
    if (state?.currentQuestion) {
      submitAnswer({
        quizQuestionId: state.currentQuestion.quizQuestionId,
        textAnswer: textAnswer.trim(),
      });
    }
  };

  if (!sessionToken) {
    return (
      <MobileShell bgImage={quizBgImageUrl} onClickLogo={() => router.push("/quiz")}>
        <p className="text-center text-[--tips-muted]">{t("cannotJoin")}</p>
      </MobileShell>
    );
  }

  const question = state?.currentQuestion;
  const revealed =
    state?.status === "QUESTION_REVEAL" || state?.status === "FREE_TEXT_REVIEW";
  // Prefer the question's own order so the badge always matches the payload.
  const questionNumber =
    question != null ? question.order + 1 : (state?.currentQuestionIndex ?? -1) + 1;

  return (
    <div className="tips-scope tips-bg relative isolate mobile-only flex min-h-screen flex-col">
      <HeroBackground imageUrl={quizBgImageUrl} />
      <header className="relative z-10 flex items-center justify-between border-b border-[--tips-glass-border] px-4 py-3">
        <OikLogo />
        <div className="flex items-center gap-2">
          <HeaderPill icon={Users}>
            {state?.participantCount ?? 0} {t("participants")}
          </HeaderPill>
          {state?.matchNumber && (
            <HeaderPill icon={CalendarDays}>
              {t("match")} {state.matchNumber} {t("of")} 26
            </HeaderPill>
          )}
        </div>
      </header>

      <main className="relative z-10 flex-1 px-4 py-4">
        {state?.status === "LOBBY" && (
          <TipsGlassCard className="flex flex-col items-center gap-6 py-12 text-center tips-animate-reveal">
              <div className="relative flex h-24 w-24 items-center justify-center">
                <span className="absolute inline-flex h-24 w-24 animate-ping rounded-full bg-[--tips-club-lime]/20" />
                <span className="absolute inline-flex h-16 w-16 animate-ping rounded-full bg-[--tips-trophy-gold]/20 [animation-delay:300ms]" />
                <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[--tips-glass-active] text-[--tips-club-lime]">
                  <Users className="h-6 w-6" />
                </span>
              </div>

              <div>
                <p className="tips-label mb-2">{t("waitingRoom")}</p>
                <p className="tips-display text-3xl text-[--tips-rink-white]">
                  {state.participantCount} {t("playersInLobby")}
                </p>
              </div>

              {participant && (
                <div className="tips-glass rounded-[--tips-radius-sm] px-4 py-2 text-sm">
                  <span className="text-[--tips-muted]">{t("registeredAs")} </span>
                  <span className="font-extrabold tips-gold-text">{participant.playerName}</span>
                  <span className="text-[--tips-muted]"> — {participant.company.name}</span>
                </div>
              )}

              {!connected && (
                <p className="text-xs text-[--tips-muted]">{t("rejoining")}</p>
              )}
          </TipsGlassCard>
        )}

        {state?.status === "COMPLETED" && (
          <TipsGlassCard className="py-12 text-center tips-animate-reveal">
              <p className="tips-label mb-2">{t("quizEnded")}</p>
              <p className="tips-display text-5xl tips-ice-text">
                {myScore} {t("points")}
              </p>
          </TipsGlassCard>
        )}

        {question && state?.status !== "LOBBY" && state?.status !== "COMPLETED" && (
          <div key={question.quizQuestionId}>
            <div className="mb-4 flex items-start justify-between">
              <TipsBadge status="LIVE">
                {t("question")} {questionNumber} {t("of")}{" "}
                {state.totalQuestions}
              </TipsBadge>
              <div className="text-right">
                <div className="tips-label text-[--tips-muted]!">{t("yourScore")}</div>
                <div className="tips-display text-3xl tips-ice-text">{myScore}</div>
              </div>
            </div>

            <div className="mb-4 flex justify-center">
              {state.status === "QUESTION_ACTIVE" && (
                <QuizTimer
                  endsAt={state.questionEndsAt}
                  totalSeconds={question.timeLimitSec}
                />
              )}
            </div>

            <TipsGlassCard className="mb-4">
                <h2 className="tips-display text-center text-2xl uppercase leading-snug md:text-3xl">
                  {localized(locale, question.textSv, question.textEn)}
                </h2>
            </TipsGlassCard>

            <AnswerGrid
              options={question.options}
              type={question.type}
              selectedOptionId={selectedOptionId}
              textAnswer={textAnswer}
              correctOptionId={state.correctOptionId}
              revealed={revealed}
              disabled={
                state.status !== "QUESTION_ACTIVE" ||
                revealed
              }
              onSelectOption={handleSelectOption}
              onTextChange={setTextAnswer}
              onSubmitText={handleSubmitText}
            />
          </div>
        )}

        {state?.status === "FREE_TEXT_REVIEW" && (
          <p className="mt-4 text-center text-sm text-[--tips-muted]">
            {t("waitingForHost")}
          </p>
        )}
      </main>

      {state && state.leaderboard.length > 0 && (
        <div className="relative z-10 px-4 pb-4">
          <Leaderboard
            entries={state.leaderboard}
            horizontal
          />
        </div>
      )}

      <div className="relative z-10">
        <AppFooter />
      </div>
    </div>
  );
}
