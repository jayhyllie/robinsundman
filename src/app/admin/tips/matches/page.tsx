"use client";

import Link from "next/link";

import { useI18n } from "~/components/providers/i18n-provider";
import {
  TeamCrest,
  TipsBadge,
  TipsButton,
  TipsGlassCard,
} from "~/components/tips/ui";
import { api } from "~/trpc/react";

export default function TipsMatchesPage() {
  const { t } = useI18n();
  const matches = api.tips.matchesList.useQuery();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="tips-label">{t("tipsMatches")}</p>
          <h1 className="tips-display text-5xl">{t("tipsMatchList")}</h1>
        </div>
        <Link href="/admin/tips/matches/new">
          <TipsButton>{t("tipsCreateMatch")}</TipsButton>
        </Link>
      </div>

      <div className="space-y-3">
        {matches.data?.map((m) => (
          <TipsGlassCard key={m.id} className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <TeamCrest
                name={m.homeTeam.name}
                logoUrl={m.homeTeam.logoUrl}
                size="sm"
              />
              <span className="tips-display text-2xl">
                {m.homeTeam.shortName}
              </span>
              <span className="text-[var(--tips-muted)]">{t("tipsVs")}</span>
              <span className="tips-display text-2xl">
                {m.awayTeam.shortName}
              </span>
              <TeamCrest
                name={m.awayTeam.name}
                logoUrl={m.awayTeam.logoUrl}
                size="sm"
              />
            </div>
            <TipsBadge
              status={
                m.status as
                  | "DRAFT"
                  | "OPEN"
                  | "CLOSED"
                  | "RESULT_REGISTERED"
                  | "WINNER_PICKED"
              }
            />
            <span className="text-sm text-[var(--tips-muted)]">
              {m.predictionCount} {t("tipsTipsCount")}
            </span>
            <span className="text-sm text-[var(--tips-muted)]">
              {new Date(m.puckDropAt).toLocaleString("sv-SE")}
            </span>
            <div className="ml-auto flex flex-wrap gap-2">
              {(m.status === "CLOSED" || m.status === "OPEN") &&
              m.homeScore == null ? (
                <Link href={`/admin/tips/matches/${m.id}`}>
                  <TipsButton variant="gold" size="sm">
                    {t("tipsRegisterResult")}
                  </TipsButton>
                </Link>
              ) : null}
              <Link href={`/admin/tips/matches/${m.id}`}>
                <TipsButton variant="secondary" size="sm">
                  {t("tipsOpen")}
                </TipsButton>
              </Link>
            </div>
          </TipsGlassCard>
        ))}
        {matches.data?.length === 0 ? (
          <TipsGlassCard>
            <p className="text-[var(--tips-muted)]">{t("tipsNoMatchesYet")}</p>
          </TipsGlassCard>
        ) : null}
      </div>
    </div>
  );
}
