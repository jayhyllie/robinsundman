"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useI18n } from "~/components/providers/i18n-provider";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { api } from "~/trpc/react";

type AwardState = Record<string, { isCorrect: boolean; points: number }>;

export function FreeTextGradingPanel({ sessionId }: { sessionId: string }) {
  const { t } = useI18n();
  const [awards, setAwards] = useState<AwardState>({});

  const { data, isLoading, refetch } = api.quiz.getFreeTextGrading.useQuery(
    { sessionId },
    { enabled: !!sessionId },
  );

  const awardMutation = api.quiz.awardFreeTextGrading.useMutation({
    onSuccess: async () => {
      toast.success(t("awardPoints"));
      await refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  useEffect(() => {
    if (!data) return;

    const initial: AwardState = {};
    for (const question of data.questions) {
      for (const sub of question.submissions) {
        initial[sub.answerId] = {
          isCorrect: sub.isCorrect ?? false,
          points: sub.points > 0 ? sub.points : 500,
        };
      }
    }
    setAwards(initial);
  }, [data]);

  if (isLoading) {
    return <p className="text-muted-foreground">{t("loading")}</p>;
  }

  if (!data || data.questions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {t("noFreeTextQuestions")}
        </CardContent>
      </Card>
    );
  }

  const handleSaveQuestion = (answerIds: string[]) => {
    const payload = answerIds.map((answerId) => ({
      answerId,
      isCorrect: awards[answerId]?.isCorrect ?? false,
      points: awards[answerId]?.points ?? 0,
    }));
    awardMutation.mutate({ sessionId, awards: payload });
  };

  const handleSaveAllPending = () => {
    const pendingIds = data.questions.flatMap((q) =>
      q.submissions.filter((s) => !s.graded).map((s) => s.answerId),
    );
    if (pendingIds.length === 0) {
      toast.message(t("noPendingFreeText"));
      return;
    }
    handleSaveQuestion(pendingIds);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{t("freeTextGrading")}</h2>
          <p className="text-sm text-muted-foreground">{t("freeTextGradingHint")}</p>
        </div>
        {data.pendingCount > 0 && (
          <Button
            onClick={handleSaveAllPending}
            disabled={awardMutation.isPending}
            className="bg-accent text-accent-foreground"
          >
            {t("awardPendingFreeText")} ({data.pendingCount})
          </Button>
        )}
      </div>

      {data.questions.map((question) => (
        <Card key={question.quizQuestionId} className="border-accent/30">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>
                {t("question")} {question.order + 1}
              </CardTitle>
              {question.pendingCount > 0 && (
                <Badge variant="secondary">
                  {question.pendingCount} {t("pendingGrading")}
                </Badge>
              )}
            </div>
            <CardDescription className="text-base text-foreground">
              {question.textSv}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {question.submissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noSubmissions")}</p>
            ) : (
              question.submissions.map((sub) => (
                <div
                  key={sub.answerId}
                  className="rounded-lg border border-border p-4"
                >
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="font-semibold">{sub.playerName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{sub.companyName}</span>
                      {sub.graded ? (
                        <Badge variant={sub.isCorrect ? "default" : "outline"}>
                          {sub.isCorrect
                            ? `${t("correct")} · ${sub.points} ${t("points")}`
                            : t("wrong")}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">{t("pendingGrading")}</Badge>
                      )}
                    </div>
                  </div>
                  <p className="mb-3 text-sm">{sub.textAnswer || "—"}</p>
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={awards[sub.answerId]?.isCorrect ?? false}
                        onCheckedChange={(checked) =>
                          setAwards((prev) => ({
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
                        value={awards[sub.answerId]?.points ?? 500}
                        onChange={(e) =>
                          setAwards((prev) => ({
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
              ))
            )}
            {question.submissions.length > 0 && (
              <Button
                variant="outline"
                onClick={() =>
                  handleSaveQuestion(question.submissions.map((s) => s.answerId))
                }
                disabled={awardMutation.isPending}
              >
                {t("saveGrading")}
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
