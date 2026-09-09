"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";

import { FreeTextGradingPanel } from "~/components/admin/free-text-grading-panel";
import { useI18n } from "~/components/providers/i18n-provider";
import { LinkButton } from "~/components/ui/link-button";
import { api } from "~/trpc/react";

export default function QuizFreeTextGradingPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Loading...</p>}>
      <QuizFreeTextGradingContent />
    </Suspense>
  );
}

function QuizFreeTextGradingContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { t } = useI18n();

  const { data: quiz } = api.quiz.getById.useQuery({ id: params.id });
  const sessionId = searchParams.get("session") ?? quiz?.sessions[0]?.id ?? "";

  if (!quiz) {
    return <p className="text-muted-foreground">{t("loading")}</p>;
  }

  if (!sessionId) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{t("freeTextGrading")}</h1>
        <p className="text-muted-foreground">{t("noSessionForGrading")}</p>
        <LinkButton href={`/admin/quiz/quizzes/${params.id}`} variant="outline">
          {t("backToQuiz")}
        </LinkButton>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("freeTextGrading")}</h1>
          <p className="text-muted-foreground">{quiz.titleSv}</p>
        </div>
        <div className="flex gap-2">
          <LinkButton href={`/admin/quiz/quizzes/${params.id}`} variant="outline">
            {t("backToQuiz")}
          </LinkButton>
          <LinkButton
            href={`/admin/quiz/quizzes/${params.id}/host?session=${sessionId}`}
            variant="outline"
          >
            {t("hostPanel")}
          </LinkButton>
        </div>
      </div>

      <FreeTextGradingPanel sessionId={sessionId} />
    </div>
  );
}
