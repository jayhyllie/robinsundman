"use client";

import { useEffect } from "react";
import { Gamepad2, Building2, Library, Trophy } from "lucide-react";

import { useI18n } from "~/components/providers/i18n-provider";
import { LinkButton } from "~/components/ui/link-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { api } from "~/trpc/react";

export default function AdminDashboard() {
  const { t } = useI18n();
  const { data: quizzes } = api.quiz.list.useQuery();
  const { data: companies } = api.company.list.useQuery();

  const ensureDefaults = api.leaderboard.ensureDefaults.useMutation();
  useEffect(() => {
    ensureDefaults.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const liveSessions = quizzes?.flatMap((q) =>
    q.sessions.filter((s) => s.status !== "COMPLETED"),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {t("appName")}{" "}
          <span className="text-gradient-yellow">{t("challenge")}</span>
        </h1>
        <p className="text-muted-foreground">{t("questionsInfo")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("quizzes")}</CardDescription>
            <CardTitle className="text-3xl">{quizzes?.length ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("companies")}</CardDescription>
            <CardTitle className="text-3xl">{companies?.length ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("live")}</CardDescription>
            <CardTitle className="text-3xl">{liveSessions?.length ?? 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/30 hover:border-primary">
          <CardHeader>
            <Gamepad2 className="mb-2 h-8 w-8 text-primary" />
            <CardTitle className="text-base">{t("quizzes")}</CardTitle>
          </CardHeader>
          <CardContent>
            <LinkButton href="/admin/quiz/quizzes" className="w-full">
              {t("viewAll")}
            </LinkButton>
          </CardContent>
        </Card>
        <Card className="border-primary/30 hover:border-primary">
          <CardHeader>
            <Building2 className="mb-2 h-8 w-8 text-primary" />
            <CardTitle className="text-base">{t("companies")}</CardTitle>
          </CardHeader>
          <CardContent>
            <LinkButton href="/admin/quiz/companies" variant="outline" className="w-full">
              {t("viewAll")}
            </LinkButton>
          </CardContent>
        </Card>
        <Card className="border-primary/30 hover:border-primary">
          <CardHeader>
            <Library className="mb-2 h-8 w-8 text-primary" />
            <CardTitle className="text-base">{t("questionBank")}</CardTitle>
          </CardHeader>
          <CardContent>
            <LinkButton href="/admin/quiz/questions" variant="outline" className="w-full">
              {t("viewAll")}
            </LinkButton>
          </CardContent>
        </Card>
        <Card className="border-primary/30 hover:border-primary">
          <CardHeader>
            <Trophy className="mb-2 h-8 w-8 text-accent" />
            <CardTitle className="text-base">{t("leaderboards")}</CardTitle>
          </CardHeader>
          <CardContent>
            <LinkButton href="/admin/quiz/leaderboards" variant="outline" className="w-full">
              {t("viewAll")}
            </LinkButton>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
