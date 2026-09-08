import Image from "next/image";

import { cn } from "~/lib/utils";

export function SponsorRibbon({
  name,
  logoUrl,
  campaignText,
  primaryColor = "#ffd700",
  className,
}: {
  name: string;
  logoUrl?: string | null;
  campaignText?: string | null;
  primaryColor?: string | null;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-[var(--tips-radius-sm)] border px-4 py-2.5",
        className,
      )}
      style={{
        borderColor: `${primaryColor ?? "#ffd700"}55`,
        background: `linear-gradient(90deg, ${primaryColor ?? "#ffd700"}18, transparent)`,
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={name}
            width={72}
            height={28}
            className="h-7 w-auto object-contain"
            unoptimized
          />
        ) : (
          <span className="tips-label !text-[var(--tips-trophy-gold)] truncate">
            {name}
          </span>
        )}
        {campaignText ? (
          <span className="truncate text-xs text-[var(--tips-muted)]">
            {campaignText}
          </span>
        ) : null}
      </div>
      <span className="shrink-0 text-[10px] font-bold tracking-[0.14em] text-[var(--tips-trophy-gold)] uppercase">
        Presented by
      </span>
    </div>
  );
}

export function SponsorFooterLockup({
  name,
  logoUrl,
  className,
}: {
  name: string;
  logoUrl?: string | null;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <span className="tips-label !text-[var(--tips-trophy-gold)]">
        Presented by
      </span>
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={name}
          width={140}
          height={48}
          className="h-10 w-auto object-contain"
          unoptimized
        />
      ) : (
        <span className="tips-display text-2xl text-[var(--tips-trophy-gold)]">
          {name}
        </span>
      )}
    </div>
  );
}
