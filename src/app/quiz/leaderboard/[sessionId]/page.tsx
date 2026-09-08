"use client";

import { useParams } from "next/navigation";

import { SidebarShell } from "~/components/layout/shell";
import { Leaderboard } from "~/components/quiz/leaderboard";
import { useI18n } from "~/components/providers/i18n-provider";
import { Badge } from "~/components/ui/badge";
import { api } from "~/trpc/react";

export default function SessionLeaderboardPage() {
  const params = useParams<{ sessionId: string }>();
  const { t } = useI18n();

  const { data: entries } = api.leaderboard.getSessionLeaderboard.useQuery({
    sessionId: params.sessionId,
  });

  const { data: session } = api.quiz.getSessionById.useQuery({
    sessionId: params.sessionId,
  });

  return (
    <SidebarShell>
      <div className="mx-auto max-w-4xl p-6 lg:p-10">
        <h1 className="mb-1 text-2xl font-extrabold tracking-wider text-white uppercase">
          {session?.quiz.matchTitle ?? t("liveLeaderboard")}
        </h1>
        <div className="mt-4 mb-4 flex gap-2">
          <Badge variant="outline" className="border-primary/50 text-primary">
            {t("liveLeaderboard")}
          </Badge>
          {session?.quiz.matchNumber && (
            <Badge variant="secondary">
              {t("match")} {session.quiz.matchNumber} {t("of")} 26
            </Badge>
          )}
        </div>
        <Leaderboard entries={entries ?? []} title={t("top5Now")} />
      </div>
    </SidebarShell>
  );
}
