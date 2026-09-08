"use client";

import { useBranding } from "~/components/providers/branding-provider";
import { cn } from "~/lib/utils";

export function OikLogo({ className, showLogo = true }: { className?: string; showLogo?: boolean }) {
  const { clubShort, logoUrl } = useBranding();

  return (
    <>
    {showLogo && (
    <div
      className={cn(
        "flex items-center gap-2 font-bold tracking-wide",
        className,
      )}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={clubShort} className="h-50 w-50 object-cover" />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-accent bg-primary/20 text-sm font-bold text-accent">
          {clubShort}
        </div>
      )}
    </div>
    )}
    </>
  );
}

export function AppTitle({
  subtitle,
  align = "center",
}: {
  subtitle?: string;
  align?: "center" | "left";
}) {
  const { appName, challengeTag } = useBranding();

  return (
    <div className={align === "left" ? "text-left" : "text-center"}>
      <p className="tips-label mb-2">{appName}</p>
      <h1 className="tips-display text-5xl text-[var(--tips-rink-white)] md:text-7xl">
        {challengeTag}
      </h1>
      {subtitle && (
        <p className="mt-3 text-sm text-[var(--tips-muted)] md:text-base">
          {subtitle}
        </p>
      )}
    </div>
  );
}
