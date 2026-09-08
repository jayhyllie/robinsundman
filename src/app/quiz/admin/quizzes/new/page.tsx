"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useI18n } from "~/components/providers/i18n-provider";
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

type SelectedQuestion = {
  questionId: string;
  timeLimitSec: number;
};

const DEFAULT_MC_SECONDS = 10;
const DEFAULT_FREE_TEXT_SECONDS = 30;

export default function NewQuizPage() {
  const router = useRouter();
  const { t } = useI18n();

  const [titleSv, setTitleSv] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [matchNumber, setMatchNumber] = useState("");
  const [matchTitle, setMatchTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [selectedQuestions, setSelectedQuestions] = useState<SelectedQuestion[]>(
    [],
  );

  const { data: bankQuestions } = api.question.listBank.useQuery();

  const createMutation = api.quiz.create.useMutation({
    onSuccess: (quiz) => {
      toast.success(t("save"));
      router.push(`/quiz/admin/quizzes/${quiz.id}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleQuestion = (id: string, type: "MULTIPLE_CHOICE" | "FREE_TEXT") => {
    setSelectedQuestions((prev) => {
      if (prev.some((q) => q.questionId === id)) {
        return prev.filter((q) => q.questionId !== id);
      }
      return [
        ...prev,
        {
          questionId: id,
          timeLimitSec:
            type === "FREE_TEXT"
              ? DEFAULT_FREE_TEXT_SECONDS
              : DEFAULT_MC_SECONDS,
        },
      ];
    });
  };

  const setTimeLimit = (questionId: string, timeLimitSec: number) => {
    setSelectedQuestions((prev) =>
      prev.map((q) =>
        q.questionId === questionId
          ? { ...q, timeLimitSec: Math.min(300, Math.max(5, timeLimitSec)) }
          : q,
      ),
    );
  };

  const handleSubmit = (asDraft: boolean) => {
    if (!titleSv.trim() || selectedQuestions.length === 0) {
      toast.error("Title and at least one question required");
      return;
    }
    createMutation.mutate({
      titleSv: titleSv.trim(),
      titleEn: titleEn.trim() || undefined,
      matchNumber: matchNumber ? Number(matchNumber) : undefined,
      matchTitle: matchTitle.trim() || undefined,
      scheduledAt: asDraft
        ? undefined
        : scheduledAt
          ? new Date(scheduledAt)
          : undefined,
      questions: selectedQuestions,
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">{t("createQuiz")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t("title")} (SV)</Label>
            <Input value={titleSv} onChange={(e) => setTitleSv(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("title")} (EN)</Label>
            <Input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("matchNumber")}</Label>
              <Input
                type="number"
                value={matchNumber}
                onChange={(e) => setMatchNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("matchTitle")}</Label>
              <Input
                value={matchTitle}
                onChange={(e) => setMatchTitle(e.target.value)}
                placeholder="ÖIK – Björklöven"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("scheduledAt")}</Label>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("questionBank")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("timeLimitHint")}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {bankQuestions?.map((q) => {
            const selected = selectedQuestions.find(
              (s) => s.questionId === q.id,
            );
            return (
              <div
                key={q.id}
                className="rounded-lg border border-border p-3 hover:bg-muted/50"
              >
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={!!selected}
                    onChange={() => toggleQuestion(q.id, q.type)}
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{q.textSv}</div>
                    <div className="text-xs text-muted-foreground">
                      {q.type === "MULTIPLE_CHOICE"
                        ? t("multipleChoice")
                        : t("freeText")}
                    </div>
                  </div>
                </label>
                {selected && (
                  <div className="mt-3 flex items-center gap-2 pl-7">
                    <Label className="text-xs whitespace-nowrap">
                      {t("timeLimit")}
                    </Label>
                    <Input
                      type="number"
                      min={5}
                      max={300}
                      className="h-8 w-20"
                      value={selected.timeLimitSec}
                      onChange={(e) =>
                        setTimeLimit(q.id, Number(e.target.value) || 5)
                      }
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-xs text-muted-foreground">
                      {t("secondsShort")}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
          {bankQuestions?.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {t("noData")}.{" "}
              <a href="/quiz/admin/questions" className="text-primary underline">
                {t("addQuestion")}
              </a>
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => handleSubmit(true)}
          disabled={createMutation.isPending}
        >
          {t("saveDraft")}
        </Button>
        <Button
          className="bg-accent text-accent-foreground hover:bg-accent/90"
          onClick={() => handleSubmit(false)}
          disabled={createMutation.isPending}
        >
          {scheduledAt ? t("scheduleQuiz") : t("save")}
        </Button>
      </div>
    </div>
  );
}
