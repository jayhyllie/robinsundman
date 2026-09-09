"use client";

import Link from "next/link";

import { useI18n } from "~/components/providers/i18n-provider";
import {
  TipsBadge,
  TipsButton,
  TipsGlassCard,
} from "~/components/tips/ui";
import { api } from "~/trpc/react";

export default function TipsAdminHomePage() {
  const { t } = useI18n();
  const matches = api.tips.matchesList.useQuery();
  const open = matches.data?.filter((m) => m.status === "OPEN") ?? [];
  const totalTips =
    matches.data?.reduce((sum, m) => sum + m.predictionCount, 0) ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <p className="tips-label">{t("admin")}</p>
        <h1 className="tips-display text-5xl">{t("tipsPredictionControl")}</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <TipsGlassCard>
          <p className="tips-label">{t("tipsMatches")}</p>
          <p className="tips-display mt-2 text-4xl">
            {matches.data?.length ?? "–"}
          </p>
        </TipsGlassCard>
        <TipsGlassCard>
          <p className="tips-label">{t("tipsOpenNow")}</p>
          <p className="tips-display mt-2 text-4xl tips-ice-text">
            {open.length}
          </p>
        </TipsGlassCard>
        <TipsGlassCard>
          <p className="tips-label">{t("tipsTotalTips")}</p>
          <p className="tips-display mt-2 text-4xl">{totalTips}</p>
        </TipsGlassCard>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/tips/matches/new">
          <TipsButton>{t("tipsCreateMatch")}</TipsButton>
        </Link>
        <Link href="/admin/tips/matches">
          <TipsButton variant="secondary">{t("tipsAllMatches")}</TipsButton>
        </Link>
      </div>

      {open[0] ? (
        <TipsGlassCard active>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <TipsBadge status="OPEN" />
              <p className="tips-display mt-2 text-3xl">
                {open[0].homeTeam.shortName} {t("tipsVs")}{" "}
                {open[0].awayTeam.shortName}
              </p>
              <p className="text-sm text-[--tips-muted]">
                {open[0].predictionCount} {t("tipsTipsCount")} · /tips/m/
                {open[0].slug}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/tips/arena/live" target="_blank">
                <TipsButton variant="secondary" size="sm">
                  {t("tipsArena")}
                </TipsButton>
              </Link>
              <Link href={`/admin/tips/matches/${open[0].id}`}>
                <TipsButton size="sm">{t("tipsManage")}</TipsButton>
              </Link>
            </div>
          </div>
        </TipsGlassCard>
      ) : null}
    </div>
  );
}
