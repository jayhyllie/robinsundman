"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useI18n } from "~/components/providers/i18n-provider";
import {
  LogoUploadDropzone,
  TeamCrest,
  TipsBadge,
  TipsButton,
  TipsGlassCard,
  TipsInput,
} from "~/components/tips/ui";
import { api } from "~/trpc/react";

export default function TeamsAdminPage() {
  const { t } = useI18n();
  const utils = api.useUtils();
  const teams = api.tips.teamsList.useQuery();
  const create = api.tips.teamCreate.useMutation();
  const update = api.tips.teamUpdate.useMutation();
  const remove = api.tips.teamDelete.useMutation();

  const [q, setQ] = useState("");
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return teams.data ?? [];
    return (teams.data ?? []).filter(
      (team) =>
        team.name.toLowerCase().includes(needle) ||
        team.shortName.toLowerCase().includes(needle),
    );
  }, [teams.data, q]);

  function resetForm() {
    setName("");
    setShortName("");
    setLogoUrl(null);
    setEditingId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="tips-label">{t("tipsTeams")}</p>
          <h1 className="tips-display text-5xl">{t("tipsTeamManagement")}</h1>
        </div>
      </div>

      <TipsInput
        label={t("tipsSearch")}
        placeholder={t("tipsFilterTeams")}
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <TipsGlassCard className="space-y-4">
          <p className="tips-display text-2xl">
            {editingId ? t("tipsEditTeam") : t("tipsCreateTeam")}
          </p>
          <TipsInput
            label={t("tipsName")}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TipsInput
            label={t("tipsShort")}
            value={shortName}
            onChange={(e) => setShortName(e.target.value)}
          />
          <LogoUploadDropzone value={logoUrl} onUploaded={setLogoUrl} />
          <div className="flex flex-wrap gap-2">
            <TipsButton
              disabled={create.isPending || update.isPending || !name || !shortName}
              onClick={async () => {
                try {
                  if (editingId) {
                    await update.mutateAsync({
                      id: editingId,
                      name,
                      shortName,
                      logoUrl,
                    });
                    toast.success(t("tipsUpdated"));
                  } else {
                    await create.mutateAsync({ name, shortName, logoUrl });
                    toast.success(t("tipsCreated"));
                  }
                  resetForm();
                  await utils.tips.teamsList.invalidate();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : t("tipsFailed"));
                }
              }}
            >
              {editingId ? t("save") : t("tipsCreateTeam")}
            </TipsButton>
            {editingId ? (
              <TipsButton variant="secondary" onClick={resetForm}>
                {t("cancel")}
              </TipsButton>
            ) : null}
          </div>
        </TipsGlassCard>

        <div className="space-y-2">
          {filtered.map((team) => (
            <TipsGlassCard
              key={team.id}
              className="flex items-center gap-3"
              active={editingId === team.id}
            >
              <TeamCrest name={team.name} logoUrl={team.logoUrl} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{team.name}</p>
                <p className="text-xs text-[--tips-muted]">{team.shortName}</p>
              </div>
              {team.isHomeClub ? (
                <TipsBadge status="LIVE">{t("tipsHome")}</TipsBadge>
              ) : (
                <TipsButton
                  size="sm"
                  variant="tertiary"
                  disabled={update.isPending}
                  onClick={async () => {
                    try {
                      await update.mutateAsync({
                        id: team.id,
                        isHomeClub: true,
                      });
                      toast.success(t("tipsSetAsHomeClub"));
                      await utils.tips.teamsList.invalidate();
                    } catch (e) {
                      toast.error(
                        e instanceof Error ? e.message : t("tipsFailed"),
                      );
                    }
                  }}
                >
                  {t("tipsSetHome")}
                </TipsButton>
              )}
              <TipsButton
                size="sm"
                variant="secondary"
                onClick={() => {
                  setEditingId(team.id);
                  setName(team.name);
                  setShortName(team.shortName);
                  setLogoUrl(team.logoUrl);
                }}
              >
                {t("edit")}
              </TipsButton>
              {!team.isHomeClub ? (
                <TipsButton
                  size="sm"
                  variant="tertiary"
                  onClick={async () => {
                    await remove.mutateAsync({ id: team.id });
                    toast.success(t("tipsDeleted"));
                    await utils.tips.teamsList.invalidate();
                  }}
                >
                  {t("delete")}
                </TipsButton>
              ) : null}
            </TipsGlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}
