"use client";

import { useParams } from "next/navigation";
import { toast } from "sonner";

import { QrDisplay } from "~/components/quiz/qr-display";
import { useI18n } from "~/components/providers/i18n-provider";
import { Badge } from "~/components/ui/badge";
import { LinkButton } from "~/components/ui/link-button";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { api } from "~/trpc/react";

export default function QuizDetailPage() {
  const params = useParams<{ id: string }>();
  const { t } = useI18n();
  const utils = api.useUtils();
  const { data: quiz } = api.quiz.getById.useQuery({ id: params.id });

  const launchMutation = api.quiz.launchSession.useMutation({
    onSuccess: (session) => {
      window.location.href = `/admin/quiz/quizzes/${params.id}/host?session=${session.id}`;
    },
  });

  const timeLimitMutation = api.quiz.updateQuestionTimeLimit.useMutation({
    onSuccess: async () => {
      await utils.quiz.getById.invalidate({ id: params.id });
      toast.success(t("save"));
    },
    onError: (e) => toast.error(e.message),
  });

  const latestSession = quiz?.sessions[0];
  const hasFreeText =
    quiz?.questions.some((qq) => qq.question.type === "FREE_TEXT") ?? false;

  const { data: pendingFreeTextCount } = api.quiz.getPendingFreeTextCount.useQuery(
    { sessionId: latestSession?.id ?? "" },
    { enabled: !!latestSession?.id && hasFreeText },
  );

  if (!quiz) return <p className="text-muted-foreground">{t("loading")}</p>;

  const canEditTime =
    quiz.status !== "COMPLETED";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{quiz.titleSv}</h1>
          <Badge className="mt-2">{quiz.status}</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {latestSession && latestSession.status !== "COMPLETED" ? (
            <LinkButton href={`/admin/quiz/quizzes/${quiz.id}/host?session=${latestSession.id}`}>
              {t("hostPanel")}
            </LinkButton>
          ) : (
            <Button
              className="bg-accent text-accent-foreground"
              onClick={() => launchMutation.mutate({ quizId: quiz.id })}
              disabled={launchMutation.isPending}
            >
              {t("launchQuiz")}
            </Button>
          )}
          {hasFreeText && latestSession && (
            <LinkButton
              href={`/admin/quiz/quizzes/${quiz.id}/grading?session=${latestSession.id}`}
              variant="outline"
            >
              {t("gradeFreeTextLater")}
              {pendingFreeTextCount ? ` (${pendingFreeTextCount})` : ""}
            </LinkButton>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {t("question")}s ({quiz.questions.length})
          </CardTitle>
          {canEditTime && (
            <p className="text-sm text-muted-foreground">{t("timeLimitHint")}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          {quiz.questions.map((qq, i) => (
            <div
              key={qq.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3 text-sm"
            >
              <div className="min-w-0 flex-1">
                <span className="text-primary">{i + 1}.</span> {qq.question.textSv}
                <Badge variant="outline" className="ml-2 text-xs">
                  {qq.question.type === "MULTIPLE_CHOICE"
                    ? t("multipleChoice")
                    : t("freeText")}
                </Badge>
              </div>
              {canEditTime ? (
                <div className="flex items-center gap-2">
                  <Label className="text-xs whitespace-nowrap">
                    {t("timeLimit")}
                  </Label>
                  <Input
                    type="number"
                    min={5}
                    max={300}
                    className="h-8 w-20"
                    defaultValue={qq.timeLimitSec}
                    key={`${qq.id}-${qq.timeLimitSec}`}
                    onBlur={(e) => {
                      const next = Math.min(
                        300,
                        Math.max(5, Number(e.target.value) || 10),
                      );
                      if (next !== qq.timeLimitSec) {
                        timeLimitMutation.mutate({
                          quizQuestionId: qq.id,
                          timeLimitSec: next,
                        });
                      }
                    }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {t("secondsShort")}
                  </span>
                </div>
              ) : (
                <Badge variant="secondary">
                  {qq.timeLimitSec} {t("secondsShort")}
                </Badge>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {latestSession && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("joinCode")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tracking-widest text-accent">
                {latestSession.joinCode}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {appUrl}/quiz/join/{latestSession.joinCode}
              </p>
            </CardContent>
          </Card>
          <QrDisplay url={`${appUrl}/quiz/join/${latestSession.joinCode}`} />
        </div>
      )}
    </div>
  );
}
