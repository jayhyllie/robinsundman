"use client";

import { useState } from "react";

import { SidebarShell } from "~/components/layout/shell";
import { CompanyLeaderboard, Leaderboard } from "~/components/quiz/leaderboard";
import { localized, useI18n } from "~/components/providers/i18n-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { api } from "~/trpc/react";

type CompanyScoreLike = { company: { name: string }; points: number };
type PlayerScoreLike = {
  id: string;
  playerName: string;
  company: { name: string };
  points: number;
};

function mapCompanyScores(scores: CompanyScoreLike[] | undefined) {
  return (
    scores?.map((s, i) => ({
      rank: i + 1,
      name: s.company.name,
      points: s.points,
    })) ?? []
  );
}

function mapPlayerScores(scores: PlayerScoreLike[] | undefined) {
  return (
    scores?.map((s, i) => ({
      rank: i + 1,
      id: s.id,
      name: s.playerName,
      company: s.company.name,
      points: s.points,
      initials: s.playerName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
    })) ?? []
  );
}

// Lets a visitor pick between the current period and any archived one for
// the same type, so past months/seasons stay browsable after rollover.
function PeriodPicker({
  activeLabel,
  archived,
  value,
  onChange,
}: {
  activeLabel: string;
  archived: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  const { t } = useI18n();
  if (archived.length === 0) return null;

  return (
    <Select
      value={value || "current"}
      onValueChange={(v) => onChange(!v || v === "current" ? "" : v)}
    >
      <SelectTrigger className="mb-4 w-full sm:w-64">
        <SelectValue placeholder={t("selectPeriod")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="current">
          {t("currentPeriod")}: {activeLabel}
        </SelectItem>
        {archived.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function LeaderboardPage() {
  const { t, locale } = useI18n();
  const [selectedSeasonId, setSelectedSeasonId] = useState("");
  const [selectedMonthlyId, setSelectedMonthlyId] = useState("");

  const { data: periods } = api.leaderboard.getActivePeriods.useQuery();
  const { data: archivedSeasons } = api.leaderboard.listArchivedPeriods.useQuery({
    type: "SEASON",
  });
  const { data: archivedMonthlies } = api.leaderboard.listArchivedPeriods.useQuery({
    type: "MONTHLY",
  });

  const { data: selectedSeason } = api.leaderboard.getPeriodById.useQuery(
    { periodId: selectedSeasonId },
    { enabled: !!selectedSeasonId },
  );
  const { data: selectedMonthly } = api.leaderboard.getPeriodById.useQuery(
    { periodId: selectedMonthlyId },
    { enabled: !!selectedMonthlyId },
  );

  const activeSeasonPeriod = periods?.find((p) => p.type === "SEASON");
  const activeMonthlyPeriod = periods?.find((p) => p.type === "MONTHLY");

  const seasonCompanies = mapCompanyScores(
    (selectedSeasonId ? selectedSeason : activeSeasonPeriod)?.companyScores,
  );
  const monthlyCompanies = mapCompanyScores(
    (selectedMonthlyId ? selectedMonthly : activeMonthlyPeriod)?.companyScores,
  );
  const mvpPlayers = mapPlayerScores(
    (selectedMonthlyId ? selectedMonthly : activeMonthlyPeriod)?.playerScores,
  );

  const archivedSeasonOptions =
    archivedSeasons?.map((p) => ({ id: p.id, label: localized(locale, p.nameSv, p.nameEn) })) ??
    [];
  const archivedMonthlyOptions =
    archivedMonthlies?.map((p) => ({ id: p.id, label: localized(locale, p.nameSv, p.nameEn) })) ??
    [];

  return (
    <SidebarShell>
      <div className="mx-auto max-w-4xl p-6 lg:p-10">
        <h1 className="mb-6 text-2xl font-extrabold tracking-wider text-white uppercase">
          {t("liveLeaderboard")}
        </h1>
        <Tabs defaultValue="season">
        <TabsList className="mb-6 bg-muted">
          <TabsTrigger value="season">{t("seasonLeague")}</TabsTrigger>
          <TabsTrigger value="monthly">{t("monthlyLeague")}</TabsTrigger>
          <TabsTrigger value="mvp">{t("monthlyMvp")}</TabsTrigger>
        </TabsList>
        <TabsContent value="season">
          <PeriodPicker
            activeLabel={
              activeSeasonPeriod
                ? localized(locale, activeSeasonPeriod.nameSv, activeSeasonPeriod.nameEn)
                : ""
            }
            archived={archivedSeasonOptions}
            value={selectedSeasonId}
            onChange={setSelectedSeasonId}
          />
          <CompanyLeaderboard title={t("seasonLeague")} entries={seasonCompanies} />
        </TabsContent>
        <TabsContent value="monthly">
          <PeriodPicker
            activeLabel={
              activeMonthlyPeriod
                ? localized(locale, activeMonthlyPeriod.nameSv, activeMonthlyPeriod.nameEn)
                : ""
            }
            archived={archivedMonthlyOptions}
            value={selectedMonthlyId}
            onChange={setSelectedMonthlyId}
          />
          <CompanyLeaderboard title={t("monthlyLeague")} entries={monthlyCompanies} />
        </TabsContent>
        <TabsContent value="mvp">
          <PeriodPicker
            activeLabel={
              activeMonthlyPeriod
                ? localized(locale, activeMonthlyPeriod.nameSv, activeMonthlyPeriod.nameEn)
                : ""
            }
            archived={archivedMonthlyOptions}
            value={selectedMonthlyId}
            onChange={setSelectedMonthlyId}
          />
          <Leaderboard title={t("monthlyMvp")} entries={mvpPlayers} />
        </TabsContent>
      </Tabs>
      </div>
    </SidebarShell>
  );
}
