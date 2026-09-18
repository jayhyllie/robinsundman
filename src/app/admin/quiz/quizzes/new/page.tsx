"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useI18n } from "~/components/providers/i18n-provider";
import { TeamCrest } from "~/components/tips/ui";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { api } from "~/trpc/react";

type SelectedQuestion = {
  questionId: string;
  timeLimitSec: number;
};

const DEFAULT_MC_SECONDS = 15;
const DEFAULT_FREE_TEXT_SECONDS = 30;
const NO_MATCH = "__none__";

function toDatetimeLocalValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function NewQuizPage() {
  const router = useRouter();
  const { t } = useI18n();

  const [titleSv, setTitleSv] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [predictionMatchId, setPredictionMatchId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [selectedQuestions, setSelectedQuestions] = useState<SelectedQuestion[]>(
    [],
  );

  const { data: bankQuestions } = api.question.listBank.useQuery();
  const { data: tipsMatches } = api.tips.matchesList.useQuery();

  const matchesByPuckDrop = useMemo(
    () =>
      [...(tipsMatches ?? [])].sort(
        (a, b) =>
          new Date(a.puckDropAt).getTime() - new Date(b.puckDropAt).getTime(),
      ),
    [tipsMatches],
  );

  const selectedMatch = matchesByPuckDrop.find(
    (m) => m.id === predictionMatchId,
  );
  const selectedMatchNumber = selectedMatch
    ? matchesByPuckDrop.findIndex((m) => m.id === selectedMatch.id) + 1
    : null;

  const createMutation = api.quiz.create.useMutation({
    onSuccess: (quiz) => {
      toast.success(t("save"));
      router.push(`/admin/quiz/quizzes/${quiz.id}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const bankById = new Map(bankQuestions?.map((q) => [q.id, q]) ?? []);

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

  const moveQuestion = (index: number, direction: -1 | 1) => {
    setSelectedQuestions((prev) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      if (!item) return prev;
      next.splice(nextIndex, 0, item);
      return next;
    });
  };

  const selectAllQuestions = () => {
    if (!bankQuestions?.length) return;
    setSelectedQuestions((prev) => {
      const existing = new Map(prev.map((q) => [q.questionId, q]));
      return bankQuestions.map((q) => {
        const already = existing.get(q.id);
        if (already) return already;
        return {
          questionId: q.id,
          timeLimitSec:
            q.type === "FREE_TEXT"
              ? DEFAULT_FREE_TEXT_SECONDS
              : DEFAULT_MC_SECONDS,
        };
      });
    });
  };

  const deselectAllQuestions = () => {
    setSelectedQuestions([]);
  };

  const handleMatchChange = (value: string | null) => {
    const id = !value || value === NO_MATCH ? "" : value;
    setPredictionMatchId(id);
    const match = matchesByPuckDrop.find((m) => m.id === id);
    if (match) {
      setScheduledAt(toDatetimeLocalValue(new Date(match.puckDropAt)));
    }
  };

  const handleSubmit = (asDraft: boolean) => {
    if (!titleSv.trim() || selectedQuestions.length === 0) {
      toast.error("Title and at least one question required");
      return;
    }
    createMutation.mutate({
      titleSv: titleSv.trim(),
      titleEn: titleEn.trim() || undefined,
      predictionMatchId: predictionMatchId || undefined,
      scheduledAt: asDraft
        ? undefined
        : scheduledAt
          ? new Date(scheduledAt)
          : undefined,
      // Array order is persisted as QuizQuestion.order
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

          <div className="space-y-2">
            <Label>{t("linkedMatch")}</Label>
            <p className="text-xs text-muted-foreground">{t("linkedMatchHint")}</p>
            {matchesByPuckDrop.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("noTipsMatches")}
              </p>
            ) : (
              <Select
                value={predictionMatchId || NO_MATCH}
                onValueChange={handleMatchChange}
              >
                <SelectTrigger className="h-auto min-h-10 w-full py-2">
                  <SelectValue placeholder={t("linkedMatch")}>
                    {selectedMatch ? (
                      <span className="flex items-center gap-2">
                        <TeamCrest
                          name={selectedMatch.homeTeam.name}
                          logoUrl={selectedMatch.homeTeam.logoUrl}
                          size="sm"
                        />
                        <span>
                          {selectedMatch.homeTeam.shortName} vs{" "}
                          {selectedMatch.awayTeam.shortName}
                        </span>
                        <TeamCrest
                          name={selectedMatch.awayTeam.name}
                          logoUrl={selectedMatch.awayTeam.logoUrl}
                          size="sm"
                        />
                      </span>
                    ) : (
                      t("noLinkedMatch")
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="w-(--anchor-width)">
                  <SelectItem value={NO_MATCH}>{t("noLinkedMatch")}</SelectItem>
                  {matchesByPuckDrop.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <span className="flex items-center gap-2">
                        <TeamCrest
                          name={m.homeTeam.name}
                          logoUrl={m.homeTeam.logoUrl}
                          size="sm"
                        />
                        <span className="font-medium">
                          {m.homeTeam.shortName} vs {m.awayTeam.shortName}
                        </span>
                        <TeamCrest
                          name={m.awayTeam.name}
                          logoUrl={m.awayTeam.logoUrl}
                          size="sm"
                        />
                        <span className="text-xs text-muted-foreground">
                          {new Date(m.puckDropAt).toLocaleString("sv-SE")}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {selectedMatch && selectedMatchNumber != null && selectedMatchNumber > 0 ? (
              <p className="text-xs text-muted-foreground">
                {t("match")} {selectedMatchNumber} ·{" "}
                {selectedMatch.homeTeam.shortName} –{" "}
                {selectedMatch.awayTeam.shortName}
              </p>
            ) : null}
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
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>{t("questionBank")}</CardTitle>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {t("timeLimitHint")}
              </p>
            </div>
            {bankQuestions && bankQuestions.length > 0 ? (
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={selectAllQuestions}
                  disabled={
                    selectedQuestions.length === bankQuestions.length
                  }
                >
                  {t("selectAll")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={deselectAllQuestions}
                  disabled={selectedQuestions.length === 0}
                >
                  {t("deselectAll")}
                </Button>
              </div>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {bankQuestions?.map((q) => {
            const selectedIndex = selectedQuestions.findIndex(
              (s) => s.questionId === q.id,
            );
            const selected =
              selectedIndex >= 0
                ? selectedQuestions[selectedIndex]
                : undefined;
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
                    <div className="flex items-center gap-2">
                      {selectedIndex >= 0 && (
                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded bg-primary/20 px-1 text-[11px] font-bold text-primary">
                          {selectedIndex + 1}
                        </span>
                      )}
                      <div className="text-sm font-medium">{q.textSv}</div>
                    </div>
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
              <a href="/admin/quiz/questions" className="text-primary underline">
                {t("addQuestion")}
              </a>
            </p>
          )}
        </CardContent>
      </Card>

      {selectedQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("questionOrder")}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t("questionOrderHint")}
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {selectedQuestions.map((selected, index) => {
              const q = bankById.get(selected.questionId);
              return (
                <div
                  key={selected.questionId}
                  className="flex items-center gap-3 rounded-lg border border-border p-3"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/15 text-sm font-bold text-primary">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {q?.textSv ?? selected.questionId}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {q?.type === "FREE_TEXT"
                        ? t("freeText")
                        : t("multipleChoice")}{" "}
                      · {selected.timeLimitSec} {t("secondsShort")}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={index === 0}
                      aria-label={t("moveUp")}
                      onClick={() => moveQuestion(index, -1)}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={index === selectedQuestions.length - 1}
                      aria-label={t("moveDown")}
                      onClick={() => moveQuestion(index, 1)}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

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
