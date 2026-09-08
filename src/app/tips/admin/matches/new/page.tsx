"use client";

import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  TeamCrest,
  TipsButton,
  TipsGlassCard,
  TipsInput,
} from "~/components/tips/ui";
import { api } from "~/trpc/react";

export default function CreateMatchPage() {
  const router = useRouter();
  const teams = api.tips.teamsList.useQuery();
  const sponsors = api.tips.sponsorsList.useQuery();
  const create = api.tips.matchCreate.useMutation();

  const home = teams.data?.find((t) => t.isHomeClub);
  const awayTeams = teams.data?.filter((t) => !t.isHomeClub) ?? [];

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
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.shortName.toLowerCase().includes(q),
    );
  }, [awayTeams, query]);

  const away = awayTeams.find((t) => t.id === awayTeamId);
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
      toast.success(publish ? "Match published" : "Draft saved");
      router.push(`/tips/admin/matches/${match.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="tips-label">Create</p>
        <h1 className="tips-display text-5xl">New match</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <TipsGlassCard>
            <p className="tips-label mb-3">Home (locked)</p>
            {home ? (
              <div className="flex items-center gap-3">
                <TeamCrest
                  name={home.name}
                  logoUrl={home.logoUrl}
                  size="md"
                />
                <div>
                  <p className="tips-display text-2xl">{home.name}</p>
                  <p className="text-xs text-[--tips-muted]">Home club</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-[--tips-muted]">
                  No home club configured. Mark one under Teams first.
                </p>
                <Link href="/tips/admin/teams">
                  <TipsButton variant="secondary" size="sm">
                    Open teams
                  </TipsButton>
                </Link>
              </div>
            )}
          </TipsGlassCard>

          <TipsInput
            label="Away team search"
            placeholder="Search opponent…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="max-h-48 space-y-1 overflow-auto">
            {filtered.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setAwayTeamId(t.id)}
                className={`tips-glass flex w-full items-center gap-3 px-3 py-2 text-left transition ${
                  awayTeamId === t.id ? "tips-glass-active" : ""
                }`}
              >
                <TeamCrest name={t.name} logoUrl={t.logoUrl} size="sm" />
                <span className="font-bold">{t.name}</span>
                <span className="ml-auto text-xs text-[--tips-muted]">
                  {t.shortName}
                </span>
              </button>
            ))}
          </div>

          <label className="flex flex-col gap-2">
            <span className="tips-label">Puck drop</span>
            <input
              type="datetime-local"
              value={puckDropLocal}
              onChange={(e) => setPuckDropLocal(e.target.value)}
              className="h-12 rounded-[--tips-radius-sm] border border-[--tips-glass-border] bg-[--tips-glass-bg] px-4 text-[--tips-rink-white] outline-none focus:border-[--tips-club-lime]"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="tips-label">Sponsor</span>
            <select
              value={sponsorId}
              onChange={(e) => setSponsorId(e.target.value)}
              className="h-12 rounded-[--tips-radius-sm] border border-[--tips-glass-border] bg-[--tips-glass-bg] px-4 text-[--tips-rink-white] outline-none"
            >
              <option value="">None</option>
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
              Publish & open
            </TipsButton>
            <TipsButton
              variant="secondary"
              disabled={create.isPending || !awayTeamId || !home}
              onClick={() => void onCreate(false)}
            >
              Save draft
            </TipsButton>
            <Link href="/tips/admin/matches">
              <TipsButton variant="tertiary">Cancel</TipsButton>
            </Link>
          </div>
        </div>

        <TipsGlassCard className="flex flex-col items-center gap-4">
          <p className="tips-label">Public QR preview</p>
          <div className="rounded-[--tips-radius-md] bg-white p-4">
            <QRCodeSVG value={previewUrl} size={200} />
          </div>
          <p className="break-all text-center text-xs text-[--tips-muted]">
            {previewUrl}
          </p>
          <p className="text-center text-xs text-[--tips-muted]">
            Final slug is assigned on create
          </p>
        </TipsGlassCard>
      </div>
    </div>
  );
}
