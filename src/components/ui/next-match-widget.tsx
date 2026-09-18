"use client";

import { useBranding } from "~/components/providers/branding-provider";
import { useI18n } from "~/components/providers/i18n-provider";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

type NextMatchWidgetProps = {
  className?: string;
  variant?: "compact" | "promo";
};

function formatMatchWhen(date: Date, locale: "sv" | "en") {
  const dayMonth = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "sv-SE", {
    day: "numeric",
    month: "long",
  }).format(date);
  const time = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  return `${dayMonth}, ${time}`;
}

export function NextMatchWidget({
  className,
  variant = "compact",
}: NextMatchWidgetProps) {
  const { t, locale } = useI18n();
  const { nextMatchBgImageUrl, clubShort } = useBranding();
  const { data: match, isLoading } = api.tips.nextHomeMatch.useQuery();

  const homeLabel = match?.homeTeam.shortName ?? clubShort;
  const awayLabel = match?.awayTeam.shortName;
  const headline =
    match && awayLabel ? `${homeLabel} vs ${awayLabel}` : null;
  const when = match
    ? formatMatchWhen(new Date(match.puckDropAt), locale)
    : null;

  if (variant === "promo") {
    if (nextMatchBgImageUrl) {
      return (
        <>
          {/* Mobile: text only — image is desktop-only */}
          <div
            className={cn(
              "rounded-lg border border-border-brand bg-card/50 p-4 md:hidden",
              className,
            )}
          >
            <div className="mb-1 text-lg font-bold tracking-wide text-white uppercase">
              {t("nextHomeMatch")}
            </div>
            {isLoading ? (
              <div className="h-8 w-40 animate-pulse rounded bg-white/10" />
            ) : headline && when ? (
              <>
                <div className="text-2xl font-semibold text-white">
                  {headline}
                </div>
                <div className="text-sm text-muted-foreground">{when}</div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                {t("noUpcomingHomeMatch")}
              </div>
            )}
          </div>
          {/* Desktop: image + overlay */}
          <div
            className={cn(
              "relative hidden overflow-hidden rounded-lg border border-primary/30 md:block",
              className,
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={nextMatchBgImageUrl}
              alt=""
              className="aspect-4/5 w-full object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-br from-primary-dark/90 via-primary-dark/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <div className="mb-1 flex items-center gap-2 text-lg font-bold tracking-wide text-white uppercase">
                {t("nextHomeMatch")}
              </div>
              {isLoading ? (
                <div className="h-8 w-48 animate-pulse rounded bg-white/10" />
              ) : headline && when ? (
                <>
                  <div className="text-2xl font-semibold text-white">
                    {headline}
                  </div>
                  <div className="text-sm text-muted-foreground">{when}</div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">
                  {t("noUpcomingHomeMatch")}
                </div>
              )}
            </div>
          </div>
        </>
      );
    }

    return (
      <div
        className={cn(
          "glass-card flex h-full flex-col items-center justify-center rounded-lg border border-primary/30 bg-linear-to-br from-primary/10 to-transparent text-center",
          className,
        )}
      >
        <div className="mb-3 text-4xl font-bold text-primary">{clubShort}</div>
        <p className="text-sm text-muted-foreground">{t("whoWillWin")}</p>
        <p className="mt-2 font-bold text-accent">{t("competeTagline")}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-border-brand bg-card/50 pb-3 text-xs",
        className,
      )}
    >
      {nextMatchBgImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={nextMatchBgImageUrl}
          alt=""
          className="mb-2 hidden aspect-video w-full rounded object-cover ring-1 ring-border md:block"
        />
      )}
      <section className="p-3">
        <div className="mb-1 flex items-center gap-2 text-primary uppercase">
          {t("nextHomeMatch").toLocaleUpperCase()}
        </div>
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-6 w-36 animate-pulse rounded bg-white/10" />
            <div className="h-4 w-28 animate-pulse rounded bg-white/10" />
          </div>
        ) : headline && when ? (
          <>
            <div className="text-xl font-semibold text-white">{headline}</div>
            <div className="uppercase text-muted-foreground">{when}</div>
          </>
        ) : (
          <div className="text-muted-foreground">{t("noUpcomingHomeMatch")}</div>
        )}
      </section>
    </div>
  );
}
