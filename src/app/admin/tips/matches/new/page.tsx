"use client";

import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useI18n } from "~/components/providers/i18n-provider";
import {
  TeamCrest,
  TipsButton,
  TipsGlassCard,
  TipsInput,
} from "~/components/tips/ui";
import { api } from "~/trpc/react";

export default function CreateMatchPage() {
  const { t } = useI18n();
  const router = useRouter();
  const teams = api.tips.teamsList.useQuery();
  const sponsors = api.tips.sponsorsList.useQuery();
  const create = api.tips.matchCreate.useMutation();

  const home = teams.data?.find((team) => team.isHomeClub);
  const awayTeams = useMemo(
    () => teams.data?.filter((team) => !team.isHomeClub) ?? [],
    [teams.data],
  );

  const [awayTeamId, setAwayTeamId] = useState("");
  const [sponsorId, setSponsorId] = useState("");
  const [query, setQuery] = useState("");
  const [puckDropLocal, setPuckDropLocal] = useState("");

  useEffect(() => {
    const d = new Date(Date.now() + 3 * 60 * 60 * 1000);
    d.setMinutes(0, 0, 0);
    const pad = (n: number) => String(n).padStart(2, "0");
    setPuckDropLocal(
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`,
    );
  }, []);

  useEffect(() => {
    if (!awayTeamId && awayTeams[0]) setAwayTeamId(awayTeams[0].id);
  }, [awayTeams, awayTeamId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return awayTeams;
    return awayTeams.filter(
      (team) =>
        team.name.toLowerCase().includes(q) ||
        team.shortName.toLowerCase().includes(q),
    );
  }, [awayTeams, query]);

  const away = awayTeams.find((team) => team.id === awayTeamId);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const previewSlug = home && away
    ? `${home.shortName}-vs-${away.shortName}`.toLowerCase()
    : "preview";
  const previewUrl = `${appUrl}/tips/m/${previewSlug}`;

  async function onCreate(publish: boolean) {
    if (!awayTeamId || !puckDropLocal) return;
    try {
      const match = await create.mutateAsync({
        awayTeamId,
        sponsorId: sponsorId || null,
        puckDropAt: new Date(puckDropLocal),
        publish,
      });
      toast.success(publish ? t("tipsMatchPublished") : t("tipsDraftSaved"));
      router.push(`/admin/tips/matches/${match.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("tipsFailed"));
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="tips-label">{t("tipsCreate")}</p>
        <h1 className="tips-display text-5xl">{t("tipsNewMatch")}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <TipsGlassCard>
            <p className="tips-label mb-3">{t("tipsHomeLocked")}</p>
            {home ? (
              <div className="flex items-center gap-3">
                <TeamCrest
                  name={home.name}
                  logoUrl={home.logoUrl}
                  size="md"
                />
                <div>
                  <p className="tips-display text-2xl">{home.name}</p>
                  <p className="text-xs text-[--tips-muted]">{t("tipsHomeClub")}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-[--tips-muted]">
                  {t("tipsNoHomeClub")}
                </p>
                <Link href="/admin/tips/teams">
                  <TipsButton variant="secondary" size="sm">
                    {t("tipsOpenTeams")}
                  </TipsButton>
                </Link>
              </div>
            )}
          </TipsGlassCard>

          <TipsInput
            label={t("tipsAwayTeamSearch")}
            placeholder={t("tipsSearchOpponent")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="max-h-48 space-y-1 overflow-auto">
            {filtered.map((team) => (
              <button
                key={team.id}
                type="button"
                onClick={() => setAwayTeamId(team.id)}
                className={`tips-glass flex w-full items-center gap-3 px-3 py-2 text-left transition ${
                  awayTeamId === team.id ? "tips-glass-active" : ""
                }`}
              >
                <TeamCrest name={team.name} logoUrl={team.logoUrl} size="sm" />
                <span className="font-bold">{team.name}</span>
                <span className="ml-auto text-xs text-[--tips-muted]">
                  {team.shortName}
                </span>
              </button>
            ))}
          </div>

          <label className="flex flex-col gap-2">
            <span className="tips-label">{t("tipsPuckDrop")}</span>
            <input
              type="datetime-local"
              value={puckDropLocal}
              onChange={(e) => setPuckDropLocal(e.target.value)}
              className="h-12 rounded-[--tips-radius-sm] border border-[--tips-glass-border] bg-[--tips-glass-bg] px-4 text-[--tips-rink-white] outline-none focus:border-[--tips-club-lime]"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="tips-label">{t("tipsSponsor")}</span>
            <select
              value={sponsorId}
              onChange={(e) => setSponsorId(e.target.value)}
              className="h-12 rounded-[--tips-radius-sm] border border-[--tips-glass-border] bg-[--tips-glass-bg] px-4 text-[--tips-rink-white] outline-none"
            >
              <option value="">{t("tipsNone")}</option>
              {sponsors.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap gap-3 pt-2">
            <TipsButton
              disabled={create.isPending || !awayTeamId || !home}
              onClick={() => void onCreate(true)}
            >
              {t("tipsPublishAndOpen")}
            </TipsButton>
            <TipsButton
              variant="secondary"
              disabled={create.isPending || !awayTeamId || !home}
              onClick={() => void onCreate(false)}
            >
              {t("saveDraft")}
            </TipsButton>
            <Link href="/admin/tips/matches">
              <TipsButton variant="tertiary">{t("cancel")}</TipsButton>
            </Link>
          </div>
        </div>

        <TipsGlassCard className="flex flex-col items-center gap-4">
          <p className="tips-label">{t("tipsPublicQrPreview")}</p>
          <div className="rounded-[--tips-radius-md] bg-white p-4">
            <QRCodeSVG value={previewUrl} size={200} />
          </div>
          <p className="break-all text-center text-xs text-[--tips-muted]">
            {previewUrl}
          </p>
          <p className="text-center text-xs text-[--tips-muted]">
            {t("tipsFinalSlugOnCreate")}
          </p>
        </TipsGlassCard>
      </div>
    </div>
  );
}
