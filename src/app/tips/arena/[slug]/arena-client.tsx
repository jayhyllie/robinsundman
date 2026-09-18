"use client";

import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";

import { useI18n } from "~/components/providers/i18n-provider";
import { TipsScope } from "~/components/tips/tips-scope";
import {
  CountdownBlocks,
  SponsorFooterLockup,
  TeamCrest,
  TipsBadge,
  TipsGlassCard,
} from "~/components/tips/ui";
import { api } from "~/trpc/react";

export function ArenaClient({ slug }: { slug: string }) {
  const { t } = useI18n();
  const matchQuery = api.tips.matchBySlug.useQuery(
    { slug },
    { refetchInterval: 10_000 },
  );
  const statsQuery = api.tips.publicStats.useQuery(
    { slug },
    { refetchInterval: 3_000 },
  );
  const sponsors = api.tips.sponsorsList.useQuery();

  const match = matchQuery.data;
  const count = statsQuery.data?.predictionCount ?? match?.predictionCount ?? 0;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const joinUrl = `${appUrl}/tips/m/${slug}`;
  const presentedBy = sponsors.data?.[0];

  if (!match) {
    return (
      <TipsScope className="flex items-center justify-center">
        <p className="tips-label">{t("tipsLoadingArena")}</p>
      </TipsScope>
    );
  }

  return (
    <TipsScope className="flex min-h-svh flex-col p-8">
      <div className="grid flex-1 gap-10 lg:grid-cols-2 lg:items-center">
        <div className="tips-animate-reveal space-y-8">
          <div className="flex justify-between relative">
            <h1 className="tips-display text-6xl leading-none md:text-7xl lg:text-8xl">
              {t("tipsScan")}
              <br />
              {t("tipsPredictDot")}
              <br />
              <span className="tips-ice-text">{t("tipsWin")}</span>
            </h1>
            {presentedBy?.logoUrl ? (
              <Image
                src={presentedBy.logoUrl}
                alt={presentedBy.name}
                width={400}
                height={400}
                className="w-120 h-auto object-contain absolute top-0 right-0"
              />
            ) : null}
          </div>

          <div className="flex items-center gap-6">
            <TeamCrest
              name={match.homeTeam.name}
              logoUrl={match.homeTeam.logoUrl}
              size="xxl"
            />
            <div>
              <p className="tips-display text-4xl md:text-9xl">
                <span className="mx-3 text-[--tips-muted]">VS</span>
              </p>
            </div>
            <TeamCrest
              name={match.awayTeam.name}
              logoUrl={match.awayTeam.logoUrl}
              size="xxl"
            />
          </div>

          <div>
            <p className="tips-label mb-3">{t("tipsPuckDrop")}</p>
            <CountdownBlocks target={match.puckDropAt} className="max-w-xl" />
          </div>
          <p className="text-4xl text-[--tips-muted]">
              <span className="tips-display tips-ice-text text-9xl tabular-nums">
                {count.toLocaleString("sv-SE")}
              </span>{" "}
              {t("tipsFansAlreadyTipped")}
            </p>
        </div>

        <TipsGlassCard className="bg-none border-none mx-auto flex w-full flex-col items-center gap-5 p-8 tips-animate-reveal">
          <div className="rounded-[--tips-radius-md] bg-white p-5">
            <QRCodeSVG value={joinUrl} size={600} level="M" />
          </div>
          <p className="tips-label text-center">{t("tipsScanToTip")}</p>
          {match.sponsor ? (
            <SponsorFooterLockup
              name={match.sponsor.name}
              logoUrl={match.sponsor.logoUrl}
              className="mt-2"
            />
          ) : null}
        </TipsGlassCard>
      </div>
    </TipsScope>
  );
}
