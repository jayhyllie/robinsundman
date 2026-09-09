"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useI18n } from "~/components/providers/i18n-provider";
import {
  ScoreStepper,
  TeamCrest,
  TipsBadge,
  TipsButton,
  TipsGlassCard,
} from "~/components/tips/ui";
import { api } from "~/trpc/react";

export default function MatchDetailPage() {
  const { t } = useI18n();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const utils = api.useUtils();
  const matchQuery = api.tips.matchById.useQuery({ id });
  const publish = api.tips.matchPublish.useMutation();
  const close = api.tips.matchClose.useMutation();
  const register = api.tips.registerResult.useMutation();

  const match = matchQuery.data;
  const [homeScore, setHomeScore] = useState(3);
  const [awayScore, setAwayScore] = useState(2);

  async function refresh() {
    await utils.tips.matchById.invalidate({ id });
    await utils.tips.matchesList.invalidate();
  }

  if (!match) {
    return <p className="tips-label">{t("loading")}</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <TipsBadge
            status={
              match.status as
                | "DRAFT"
                | "OPEN"
                | "CLOSED"
                | "RESULT_REGISTERED"
                | "WINNER_PICKED"
            }
          />
          <h1 className="tips-display mt-2 text-5xl">
            {match.homeTeam.shortName} {t("tipsVs")} {match.awayTeam.shortName}
          </h1>
          <p className="mt-1 text-sm text-[--tips-muted]">
            /tips/m/{match.slug} · {match.predictionCount} {t("tipsTipsCount")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/tips/m/${match.slug}`} target="_blank">
            <TipsButton variant="secondary" size="sm">
              {t("tipsMobile")}
            </TipsButton>
          </Link>
          <Link href="/tips/arena/live" target="_blank">
            <TipsButton variant="secondary" size="sm">
              {t("tipsArena")}
            </TipsButton>
          </Link>
          <Link href="/tips/arena/live/winner" target="_blank">
            <TipsButton variant="gold" size="sm">
              {t("tipsWinnerScreen")}
            </TipsButton>
          </Link>
        </div>
      </div>

      <TipsGlassCard className="flex items-center justify-center gap-6">
        <TeamCrest
          name={match.homeTeam.name}
          logoUrl={match.homeTeam.logoUrl}
          size="lg"
        />
        <span className="tips-display text-4xl text-[--tips-muted] uppercase">
          {t("tipsVs")}
        </span>
        <TeamCrest
          name={match.awayTeam.name}
          logoUrl={match.awayTeam.logoUrl}
          size="lg"
        />
      </TipsGlassCard>

      <div className="flex flex-wrap gap-3">
        {match.status === "DRAFT" ? (
          <TipsButton
            disabled={publish.isPending}
            onClick={async () => {
              await publish.mutateAsync({ id });
              toast.success(t("tipsPublished"));
              await refresh();
            }}
          >
            {t("tipsPublish")}
          </TipsButton>
        ) : null}
        {match.status === "OPEN" ? (
          <TipsButton
            variant="secondary"
            disabled={close.isPending}
            onClick={async () => {
              await close.mutateAsync({ id });
              toast.success(t("tipsClosedToast"));
              await refresh();
            }}
          >
            {t("tipsCloseTipping")}
          </TipsButton>
        ) : null}
        <Link href={`/admin/tips/matches/${id}/winner`}>
          <TipsButton variant="gold">{t("tipsWinnerSelection")}</TipsButton>
        </Link>
      </div>

      <TipsGlassCard>
        <p className="tips-label mb-4">{t("tipsRegisterResult")}</p>
        <div className="flex items-center justify-center gap-6">
          <ScoreStepper
            label={match.homeTeam.shortName}
            value={homeScore}
            onChange={setHomeScore}
          />
          <span className="tips-display text-3xl text-[--tips-muted]">
            –
          </span>
          <ScoreStepper
            label={match.awayTeam.shortName}
            value={awayScore}
            onChange={setAwayScore}
          />
        </div>
        <TipsButton
          className="mt-6 w-full"
          variant="gold"
          disabled={register.isPending}
          onClick={async () => {
            await register.mutateAsync({ id, homeScore, awayScore });
            toast.success(t("tipsResultSaved"));
            await refresh();
          }}
        >
          {t("tipsSaveFinalScore")} {homeScore}–{awayScore}
        </TipsButton>
        {match.homeScore != null ? (
          <p className="mt-3 text-center text-sm text-[--tips-muted]">
            {t("tipsCurrentResult")}: {match.homeScore}–{match.awayScore}
          </p>
        ) : null}
      </TipsGlassCard>

      <TipsGlassCard>
        <p className="tips-label mb-3">{t("tipsRecentTips")}</p>
        <div className="max-h-64 space-y-2 overflow-auto">
          {match.predictions.slice(0, 30).map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between border-b border-[--tips-glass-border] py-2 text-sm"
            >
              <span>{p.playerName}</span>
              <span className="tips-display text-lg">
                {p.homeGoals}–{p.awayGoals}
              </span>
            </div>
          ))}
          {match.predictions.length === 0 ? (
            <p className="text-sm text-[--tips-muted]">{t("tipsNoTipsYet")}</p>
          ) : null}
        </div>
      </TipsGlassCard>
    </div>
  );
}
