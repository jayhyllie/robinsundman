"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Users } from "lucide-react";
import { toast } from "sonner";

import { Leaderboard } from "~/components/quiz/leaderboard";
import { QrDisplay } from "~/components/quiz/qr-display";
import { useI18n } from "~/components/providers/i18n-provider";
import { LinkButton } from "~/components/ui/link-button";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { useSocketSession } from "~/hooks/use-socket-session";
import { api } from "~/trpc/react";

export default function HostPanelClient() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session") ?? "";
  const { t } = useI18n();

  const [adminSecret, setAdminSecret] = useState<string | null>(null);
  const [freeTextAwards, setFreeTextAwards] = useState<
    Record<string, { isCorrect: boolean; points: number }>
  >({});

  useEffect(() => {
    void fetch("/api/socket-token")
      .then((r) => r.json())
      .then((data: { secret?: string }) => {
        if (data.secret) setAdminSecret(data.secret);
      });
  }, []);

  const { data: session } = api.quiz.getSessionById.useQuery(
    { sessionId },
    { enabled: !!sessionId },
  );

  const { data: freeTextGrading } = api.quiz.getFreeTextGrading.useQuery(
    { sessionId },
    { enabled: !!sessionId },
  );

  const {
    state,
    connected,
    freeTextSubmissions,
    startQuestion,
    nextQuestion,
    awardFreeText,
    endQuiz,
  } = useSocketSession({
    sessionId,
    isAdmin: true,
    adminSecret: adminSecret ?? undefined,
    enabled: !!sessionId && !!adminSecret,
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const joinCode = session?.joinCode ?? "";
  const currentIndex = state?.currentQuestionIndex ?? -1;
  const nextIndex = currentIndex + 1;

  const handleNext = () => {
    if (
      state?.status !== "QUESTION_REVEAL" &&
      state?.status !== "FREE_TEXT_REVIEW"
    ) {
      return;
    }

    if (nextIndex >= (state?.totalQuestions ?? 0)) {
      endQuiz();
    } else {
      nextQuestion(nextIndex);
    }
  };

  const handleAwardFreeText = () => {
    const awards = freeTextSubmissions.map((s) => ({
      answerId: s.answerId,
      isCorrect: freeTextAwards[s.answerId]?.isCorrect ?? false,
      points: freeTextAwards[s.answerId]?.points ?? 0,
    }));
    awardFreeText(awards);
    toast.success(t("awardPoints"));
  };

  if (!sessionId) {
    return <p>No session selected</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("hostPanel")}</h1>
          <div className="mt-2 flex gap-2">
            <Badge variant={connected ? "default" : "destructive"}>
              {connected ? "Connected" : "Disconnected"}
            </Badge>
            <Badge variant="outline">
              <Users className="mr-1 h-3 w-3" />
              {state?.participantCount ?? 0} {t("participants")}
            </Badge>
            <Badge variant="secondary">{state?.status ?? "..."}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {session?.quizId &&
            freeTextGrading &&
            freeTextGrading.questions.length > 0 && (
            <LinkButton
              href={`/quiz/admin/quizzes/${session.quizId}/grading?session=${sessionId}`}
              variant="outline"
            >
              {t("gradeFreeTextLater")}
              {freeTextGrading.pendingCount > 0
                ? ` (${freeTextGrading.pendingCount})`
                : ""}
            </LinkButton>
          )}
          {state?.status === "LOBBY" && (
            <Button onClick={() => startQuestion(0)}>{t("startQuiz")}</Button>
          )}
          {(state?.status === "QUESTION_REVEAL" ||
            state?.status === "FREE_TEXT_REVIEW") && (
            <Button
              onClick={handleNext}
              className="bg-accent text-accent-foreground"
            >
              {nextIndex >= (state?.totalQuestions ?? 0)
                ? t("endQuiz")
                : t("nextQuestion")}
            </Button>
          )}
        </div>
      </div>

      {state?.status === "LOBBY" ? (
        <Card className="glass-card border-primary/40">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-xl text-accent">
              {t("joinCode")}: <span className="tracking-widest">{joinCode}</span>
            </CardTitle>
            <Badge variant="outline" className="border-primary/50">
              <Users className="mr-1 h-3 w-3" />
              {state.participantCount} {t("playersInLobby")}
            </Badge>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-[auto_1fr]">
            <QrDisplay url={`${appUrl}/quiz/join/${joinCode}`} size={200} />
            <div>
              {state.participants.length === 0 ? (
                <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  {t("scanQr")}
                </p>
              ) : (
                <div className="grid max-h-80 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-4">
                  {state.participants.map((p) => (
                    <div
                      key={p.id}
                      className="animate-in fade-in slide-in-from-bottom-1 flex items-center gap-2 rounded-lg border border-border/50 bg-card/50 p-2 duration-300"
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="bg-primary/20 text-xs text-primary">
                          {p.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="truncate text-xs font-semibold">{p.name}</div>
                        <div className="truncate text-[10px] text-muted-foreground">
                          {p.company}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {t("joinCode")}: {joinCode}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 sm:flex-row">
              <QrDisplay url={`${appUrl}/quiz/join/${joinCode}`} size={120} />
              <div className="space-y-2 text-sm">
                <p>
                  {t("question")}{" "}
                  {currentIndex >= 0
                    ? `${currentIndex + 1} / ${state?.totalQuestions}`
                    : `- / ${state?.totalQuestions}`}
                </p>
              </div>
            </CardContent>
          </Card>

          <Leaderboard entries={state?.leaderboard ?? []} />
        </div>
      )}

      {state?.status === "FREE_TEXT_REVIEW" && (
        <Card className="border-accent/50">
          <CardHeader>
            <CardTitle className="text-accent">{t("freeTextReview")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("freeTextSkipHint")}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {freeTextSubmissions.map((sub) => (
              <div
                key={sub.answerId}
                className="rounded-lg border border-border p-4"
              >
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-semibold">{sub.playerName}</span>
                  <span className="text-muted-foreground">
                    {sub.companyName}
                  </span>
                </div>
                <p className="mb-3 text-sm">{sub.textAnswer}</p>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={
                        freeTextAwards[sub.answerId]?.isCorrect ?? false
                      }
                      onCheckedChange={(checked) =>
                        setFreeTextAwards((prev) => ({
                          ...prev,
                          [sub.answerId]: {
                            isCorrect: checked === true,
                            points: prev[sub.answerId]?.points ?? 500,
                          },
                        }))
                      }
                    />
                    {t("markCorrect")}
                  </label>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">{t("points")}</Label>
                    <Input
                      type="number"
                      min={0}
                      max={1000}
                      className="w-24"
                      value={freeTextAwards[sub.answerId]?.points ?? 500}
                      onChange={(e) =>
                        setFreeTextAwards((prev) => ({
                          ...prev,
                          [sub.answerId]: {
                            isCorrect: prev[sub.answerId]?.isCorrect ?? false,
                            points: Number(e.target.value),
                          },
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleAwardFreeText}
                className="bg-accent text-accent-foreground"
              >
                {t("awardPoints")}
              </Button>
              <Button variant="outline" onClick={handleNext}>
                {nextIndex >= (state?.totalQuestions ?? 0)
                  ? t("endQuiz")
                  : t("nextQuestion")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {state?.currentQuestion && (
        <Card>
          <CardHeader>
            <CardTitle>
              {t("question")} {currentIndex + 1}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{state.currentQuestion.textSv}</p>
            <Separator className="my-3" />
            {state.currentQuestion.type === "FREE_TEXT" ? (
              <Badge variant="outline">{t("freeText")}</Badge>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {state.currentQuestion.options.map((o) => {
                  const isCorrect = state.correctOptionId === o.id;
                  return (
                    <div
                      key={o.id}
                      className={
                        isCorrect
                          ? "flex items-center justify-between gap-2 rounded-lg border-2 border-green-500 bg-green-500/15 px-3 py-2 text-sm"
                          : "flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                      }
                    >
                      <span>
                        <span className="font-semibold">{o.letter}:</span>{" "}
                        {o.labelSv}
                      </span>
                      {isCorrect && (
                        <Badge className="bg-green-600 text-white hover:bg-green-600">
                          {t("correctOption")}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
