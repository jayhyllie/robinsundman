"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

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
      (t) =>
        t.name.toLowerCase().includes(needle) ||
        t.shortName.toLowerCase().includes(needle),
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
          <p className="tips-label">Teams</p>
          <h1 className="tips-display text-5xl">Team management</h1>
        </div>
      </div>

      <TipsInput
        label="Search"
        placeholder="Filter teams…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <TipsGlassCard className="space-y-4">
          <p className="tips-display text-2xl">
            {editingId ? "Edit team" : "Create team"}
          </p>
          <TipsInput
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TipsInput
            label="Short"
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
                    toast.success("Updated");
                  } else {
                    await create.mutateAsync({ name, shortName, logoUrl });
                    toast.success("Created");
                  }
                  resetForm();
                  await utils.tips.teamsList.invalidate();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Failed");
                }
              }}
            >
              {editingId ? "Save" : "Create team"}
            </TipsButton>
            {editingId ? (
              <TipsButton variant="secondary" onClick={resetForm}>
                Cancel
              </TipsButton>
            ) : null}
          </div>
        </TipsGlassCard>

        <div className="space-y-2">
          {filtered.map((t) => (
            <TipsGlassCard
              key={t.id}
              className="flex items-center gap-3"
              active={editingId === t.id}
            >
              <TeamCrest name={t.name} logoUrl={t.logoUrl} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{t.name}</p>
                <p className="text-xs text-[--tips-muted]">{t.shortName}</p>
              </div>
              {t.isHomeClub ? (
                <TipsBadge status="LIVE">Home</TipsBadge>
              ) : (
                <TipsButton
                  size="sm"
                  variant="tertiary"
                  disabled={update.isPending}
                  onClick={async () => {
                    try {
                      await update.mutateAsync({ id: t.id, isHomeClub: true });
                      toast.success("Set as home club");
                      await utils.tips.teamsList.invalidate();
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Failed");
                    }
                  }}
                >
                  Set home
                </TipsButton>
              )}
              <TipsButton
                size="sm"
                variant="secondary"
                onClick={() => {
                  setEditingId(t.id);
                  setName(t.name);
                  setShortName(t.shortName);
                  setLogoUrl(t.logoUrl);
                }}
              >
                Edit
              </TipsButton>
              {!t.isHomeClub ? (
                <TipsButton
                  size="sm"
                  variant="tertiary"
                  onClick={async () => {
                    await remove.mutateAsync({ id: t.id });
                    toast.success("Deleted");
                    await utils.tips.teamsList.invalidate();
                  }}
                >
                  Delete
                </TipsButton>
              ) : null}
            </TipsGlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}
