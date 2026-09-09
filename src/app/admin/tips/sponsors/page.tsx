"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  LogoUploadDropzone,
  TipsButton,
  TipsGlassCard,
  TipsInput,
} from "~/components/tips/ui";
import { api } from "~/trpc/react";

export default function SponsorsAdminPage() {
  const utils = api.useUtils();
  const sponsors = api.tips.sponsorsList.useQuery();
  const create = api.tips.sponsorCreate.useMutation();
  const update = api.tips.sponsorUpdate.useMutation();
  const remove = api.tips.sponsorDelete.useMutation();

  const [expanded, setExpanded] = useState<string | null>("new");
  const [name, setName] = useState("");
  const [campaignText, setCampaignText] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#ffd700");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  function reset() {
    setName("");
    setCampaignText("");
    setPrimaryColor("#ffd700");
    setLogoUrl(null);
    setIsActive(true);
    setEditingId(null);
    setExpanded("new");
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="tips-label">Sponsors</p>
        <h1 className="tips-display text-5xl">Sponsor management</h1>
      </div>

      <TipsGlassCard className="space-y-4">
        <button
          type="button"
          className="tips-display w-full text-left text-2xl"
          onClick={() => setExpanded(expanded === "new" ? null : "new")}
        >
          {editingId ? "Edit sponsor" : "Create sponsor"}{" "}
          <span className="text-[--tips-muted]">
            {expanded === "new" ? "−" : "+"}
          </span>
        </button>
        {expanded === "new" ? (
          <>
            <TipsInput
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TipsInput
              label="Campaign message"
              value={campaignText}
              onChange={(e) => setCampaignText(e.target.value)}
            />
            <label className="flex flex-col gap-2">
              <span className="tips-label">Primary color</span>
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-12 w-20 cursor-pointer rounded border border-[--tips-glass-border] bg-transparent"
              />
            </label>
            <LogoUploadDropzone value={logoUrl} onUploaded={setLogoUrl} />
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="size-4 accent-[--tips-club-lime]"
              />
              Show on all screens
            </label>
            <div className="flex gap-2">
              <TipsButton
                disabled={!name || create.isPending || update.isPending}
                onClick={async () => {
                  try {
                    if (editingId) {
                      await update.mutateAsync({
                        id: editingId,
                        name,
                        campaignText,
                        primaryColor,
                        logoUrl,
                        isActive,
                      });
                      toast.success("Updated");
                    } else {
                      await create.mutateAsync({
                        name,
                        campaignText,
                        primaryColor,
                        logoUrl,
                        isActive,
                      });
                      toast.success("Created");
                    }
                    reset();
                    await utils.tips.sponsorsList.invalidate();
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Failed");
                  }
                }}
              >
                {editingId ? "Save" : "Create"}
              </TipsButton>
              {editingId ? (
                <TipsButton variant="secondary" onClick={reset}>
                  Cancel
                </TipsButton>
              ) : null}
            </div>
          </>
        ) : null}
      </TipsGlassCard>

      <div className="space-y-3">
        {sponsors.data?.map((s) => (
          <TipsGlassCard key={s.id}>
            <button
              type="button"
              className="flex w-full items-center gap-4 text-left"
              onClick={() =>
                setExpanded(expanded === s.id ? null : s.id)
              }
            >
              <span
                className="size-4 rounded-full"
                style={{ background: s.primaryColor ?? "#ffd700" }}
              />
              <div className="min-w-0 flex-1">
                <p className="tips-display text-2xl">{s.name}</p>
                <p className="truncate text-xs text-[--tips-muted]">
                  {s.campaignText && s.campaignText.length > 0
                    ? s.campaignText
                    : "No campaign text"}
                </p>
              </div>
              <span className="text-xs font-bold tracking-wide uppercase text-[--tips-muted]">
                {s.isActive ? "Active" : "Off"}
              </span>
            </button>
            {expanded === s.id ? (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-[--tips-glass-border] pt-4">
                <TipsButton
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setEditingId(s.id);
                    setName(s.name);
                    setCampaignText(s.campaignText ?? "");
                    setPrimaryColor(s.primaryColor ?? "#ffd700");
                    setLogoUrl(s.logoUrl);
                    setIsActive(s.isActive);
                    setExpanded("new");
                  }}
                >
                  Edit
                </TipsButton>
                <TipsButton
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    await update.mutateAsync({
                      id: s.id,
                      isActive: !s.isActive,
                    });
                    await utils.tips.sponsorsList.invalidate();
                  }}
                >
                  {s.isActive ? "Hide" : "Show on screens"}
                </TipsButton>
                <TipsButton
                  size="sm"
                  variant="tertiary"
                  onClick={async () => {
                    await remove.mutateAsync({ id: s.id });
                    toast.success("Deleted");
                    await utils.tips.sponsorsList.invalidate();
                  }}
                >
                  Delete
                </TipsButton>
              </div>
            ) : null}
          </TipsGlassCard>
        ))}
      </div>
    </div>
  );
}
