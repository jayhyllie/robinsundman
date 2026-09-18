"use client";

import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";

import { JumboFrame } from "~/components/tips/jumbo-frame";
import { useI18n } from "~/components/providers/i18n-provider";
import {
  CountdownBlocks,
  SponsorFooterLockup,
  TeamCrest,
  TipsGlassCard,
} from "~/components/tips/ui";
import { api } from "~/trpc/react";

export function JumboArenaClient({ slug }: { slug: string }) {
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
      <JumboFrame className="flex items-center justify-center">
        <p className="tips-label">{t("tipsLoadingArena")}</p>
      </JumboFrame>
    );
  }

  return (
    <JumboFrame>
      <div className="grid h-full grid-cols-[1.15fr_0.85fr] gap-6 px-7 py-5">
        <div className="tips-animate-reveal flex min-h-0 flex-col justify-between">
          <div className="relative pr-28">
            <h1 className="tips-display text-[56px] leading-[0.92]">
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
                width={200}
                height={200}
                className="absolute top-0 right-0 w-64 h-auto object-contain"
              />
            ) : null}
          </div>

          <div className="flex items-center gap-4">
            <TeamCrest
              name={match.homeTeam.name}
              logoUrl={match.homeTeam.logoUrl}
              size="xl"
            />
            <span className="tips-display text-5xl text-[--tips-muted]">
              VS
            </span>
            <TeamCrest
              name={match.awayTeam.name}
              logoUrl={match.awayTeam.logoUrl}
              size="xl"
            />
          </div>

          <div>
            <p className="tips-label mb-2 text-[11px]!">{t("tipsPuckDrop")}</p>
            <CountdownBlocks
              target={match.puckDropAt}
              dense
              className="max-w-md"
            />
          </div>

          <p className="text-lg text-[--tips-muted]">
            <span className="tips-display tips-ice-text text-5xl tabular-nums">
              {count.toLocaleString("sv-SE")}
            </span>{" "}
            {t("tipsFansAlreadyTipped")}
          </p>
        </div>

        <div className="flex h-full flex-col items-center justify-center gap-3 border-none bg-transparenttips-animate-reveal">
            <QRCodeSVG value={joinUrl} size={420} level="M" />
          <p className="tips-label text-center text-[11px]!">
            {t("tipsScanToTip")}
          </p>
        </div>
      </div>
    </JumboFrame>
  );
}
