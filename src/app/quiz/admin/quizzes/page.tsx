"use client";

import { Plus } from "lucide-react";

import { useI18n } from "~/components/providers/i18n-provider";
import { Badge } from "~/components/ui/badge";
import { LinkButton } from "~/components/ui/link-button";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { api } from "~/trpc/react";

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  DRAFT: "secondary",
  SCHEDULED: "outline",
  LIVE: "default",
  COMPLETED: "secondary",
};

export default function AdminQuizzesPage() {
  const { t } = useI18n();
  const { data: quizzes, isLoading } = api.quiz.list.useQuery();
  const launchMutation = api.quiz.launchSession.useMutation({
    onSuccess: (session) => {
      window.location.href = `/quiz/admin/quizzes/${session.quizId}/host?session=${session.id}`;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("quizzes")}</h1>
        <LinkButton
          href="/quiz/admin/quizzes/new"
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("createQuiz")}
        </LinkButton>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("title")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead>{t("match")}</TableHead>
              <TableHead className="text-right">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {quizzes?.map((quiz) => {
              const latestSession = quiz.sessions[0];
              return (
                <TableRow key={quiz.id}>
                  <TableCell className="font-medium">{quiz.titleSv}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[quiz.status] ?? "secondary"}>
                      {quiz.status === "DRAFT"
                        ? t("draft")
                        : quiz.status === "SCHEDULED"
                          ? t("scheduled")
                          : quiz.status === "LIVE"
                            ? t("live")
                            : t("completed")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {quiz.matchNumber
                      ? `${t("match")} ${quiz.matchNumber}`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <LinkButton
                      variant="outline"
                      size="sm"
                      href={`/quiz/admin/quizzes/${quiz.id}`}
                    >
                      {t("edit")}
                    </LinkButton>
                    {latestSession && latestSession.status !== "COMPLETED" ? (
                      <LinkButton
                        size="sm"
                        href={`/quiz/admin/quizzes/${quiz.id}/host?session=${latestSession.id}`}
                      >
                        {t("hostPanel")}
                      </LinkButton>
                    ) : (
                      <Button
                        size="sm"
                        disabled={launchMutation.isPending}
                        onClick={() =>
                          launchMutation.mutate({ quizId: quiz.id })
                        }
                      >
                        {t("launchQuiz")}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
