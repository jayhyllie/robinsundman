"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";

import { useI18n } from "~/components/providers/i18n-provider";
import {
  TipsBadge,
  TipsButton,
  TipsGlassCard,
} from "~/components/tips/ui";
import { api } from "~/trpc/react";

export default function WinnerAdminPage() {
  const { t } = useI18n();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const utils = api.useUtils();
  const matchQuery = api.tips.matchById.useQuery({ id });
  const correct = api.tips.correctPredictions.useQuery({ matchId: id });
  const draw = api.tips.drawWinner.useMutation();
  const redraw = api.tips.redrawWinner.useMutation();

  const match = matchQuery.data;
  const winner = match?.winner;

  async function refresh() {
    await Promise.all([
      utils.tips.matchById.invalidate({ id }),
      utils.tips.correctPredictions.invalidate({ matchId: id }),
    ]);
  }

  if (!match) return <p className="tips-label">{t("loading")}</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="tips-label">{t("tipsWinner")}</p>
        <h1 className="tips-display text-5xl">
          {match.homeTeam.shortName} {t("tipsVs")} {match.awayTeam.shortName}
        </h1>
        <p className="mt-1 text-sm text-[var(--tips-muted)]">
          {t("tipsResult")} {match.homeScore ?? "–"}–{match.awayScore ?? "–"} ·{" "}
          {correct.data?.length ?? 0} {t("tipsExactTips")}
        </p>
      </div>

      {winner ? (
        <TipsGlassCard className="tips-animate-glow border-[var(--tips-trophy-gold)]/40">
          <TipsBadge status="WINNER_PICKED" />
          <p className="tips-display mt-3 text-5xl tips-gold-text">
            {winner.prediction.playerName}
          </p>
          <p className="mt-2 tips-ice-text tips-display text-3xl">
            {winner.prediction.homeGoals}–{winner.prediction.awayGoals}
          </p>
          <p className="mt-2 text-sm text-[var(--tips-muted)]">
            {t("tipsDrawn")} {new Date(winner.drawnAt).toLocaleString("sv-SE")}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/tips/arena/live/winner" target="_blank">
              <TipsButton variant="gold">{t("tipsShowOnJumbotron")}</TipsButton>
            </Link>
            <TipsButton
              variant="secondary"
              disabled={redraw.isPending}
              onClick={async () => {
                try {
                  await redraw.mutateAsync({ matchId: id });
                  toast.success(t("tipsNewWinnerDrawn"));
                  await refresh();
                } catch (e) {
                  toast.error(
                    e instanceof Error ? e.message : t("tipsRedrawFailed"),
                  );
                }
              }}
            >
              {t("tipsDrawAgain")}
            </TipsButton>
          </div>
        </TipsGlassCard>
      ) : (
        <TipsGlassCard>
          <p className="tips-display text-3xl">{t("tipsDrawPool")}</p>
          <p className="mt-2 text-sm text-[var(--tips-muted)]">
            {t("tipsDrawPoolHint")}
          </p>
          <TipsButton
            className="mt-5"
            variant="gold"
            disabled={
              draw.isPending ||
              match.homeScore == null ||
              (correct.data?.length ?? 0) === 0
            }
            onClick={async () => {
              try {
                await draw.mutateAsync({ matchId: id });
                toast.success(t("tipsWinnerDrawn"));
                await refresh();
              } catch (e) {
                toast.error(
                  e instanceof Error ? e.message : t("tipsDrawFailed"),
                );
              }
            }}
          >
            {t("tipsDrawWinner")}
          </TipsButton>
        </TipsGlassCard>
      )}

      <TipsGlassCard>
        <p className="tips-label mb-3">{t("tipsExactPredictions")}</p>
        <div className="max-h-80 space-y-2 overflow-auto">
          {correct.data?.map((p) => (
            <div
              key={p.id}
              className="flex justify-between border-b border-[var(--tips-glass-border)] py-2 text-sm"
            >
              <span>{p.playerName}</span>
              <span className="text-[var(--tips-muted)]">{p.email}</span>
            </div>
          ))}
          {(correct.data?.length ?? 0) === 0 ? (
            <p className="text-sm text-[var(--tips-muted)]">
              {t("tipsNoExactTipsYet")}
            </p>
          ) : null}
        </div>
      </TipsGlassCard>

      <Link href={`/admin/tips/matches/${id}`}>
        <TipsButton variant="tertiary">{t("tipsBackToMatch")}</TipsButton>
      </Link>
    </div>
  );
}
