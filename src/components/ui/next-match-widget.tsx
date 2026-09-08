"use client";

import { CalendarClock } from "lucide-react";

import { useBranding } from "~/components/providers/branding-provider";
import { useI18n } from "~/components/providers/i18n-provider";
import { cn } from "~/lib/utils";

type NextMatchWidgetProps = {
  className?: string;
  variant?: "compact" | "promo";
};

export function NextMatchWidget({
  className,
  variant = "compact",
}: NextMatchWidgetProps) {
  const { t } = useI18n();
  const { nextMatchBgImageUrl, clubShort } = useBranding();

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
            <div className="text-2xl font-semibold text-white">{clubShort} vs AIK</div>
            <div className="text-sm text-muted-foreground">5 februari, 19:00</div>
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
              <div className="text-2xl font-semibold text-white">{clubShort} vs AIK</div>
              <div className="text-sm text-muted-foreground">5 februari, 19:00</div>
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
          {/* <CalendarClock className="h-3 w-3" /> */}
          {t("nextHomeMatch").toLocaleUpperCase()}
        </div>
        <div className="text-xl font-semibold text-white">{clubShort} vs AIK</div>
        <div className="uppercase text-muted-foreground">5 februari, 19:00</div>
      </section>
    </div>
  );
}
