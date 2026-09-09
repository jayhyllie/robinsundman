"use client";

import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

import { useI18n } from "~/components/providers/i18n-provider";
import type { TranslationKey } from "~/i18n/translations";
import { cn } from "~/lib/utils";

const tipsBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-[var(--tips-radius-pill)] px-3 py-1 font-[family-name:var(--tips-font-body)] text-[10px] font-extrabold tracking-[0.16em] uppercase",
  {
    variants: {
      status: {
        DRAFT: "bg-white/10 text-white/70",
        OPEN: "bg-[rgba(57,255,20,0.15)] text-[var(--tips-ice-highlight)]",
        CLOSED: "bg-white/10 text-white/60",
        RESULT_REGISTERED: "bg-[rgba(164,198,57,0.2)] text-[var(--tips-club-lime)]",
        WINNER_PICKED: "bg-[rgba(255,215,0,0.18)] text-[var(--tips-trophy-gold)]",
        LIVE: "bg-[rgba(57,255,20,0.15)] text-[var(--tips-ice-highlight)]",
      },
    },
    defaultVariants: {
      status: "DRAFT",
    },
  },
);

const statusLabelKeys: Record<
  NonNullable<VariantProps<typeof tipsBadgeVariants>["status"]>,
  TranslationKey
> = {
  DRAFT: "tipsBadgeDraft",
  OPEN: "tipsBadgeOpen",
  CLOSED: "tipsBadgeClosed",
  RESULT_REGISTERED: "tipsBadgeResult",
  WINNER_PICKED: "tipsBadgeWinner",
  LIVE: "tipsBadgeLive",
};

export function TipsBadge({
  className,
  status,
  children,
  liveDot,
}: {
  className?: string;
  children?: ReactNode;
  liveDot?: boolean;
} & VariantProps<typeof tipsBadgeVariants>) {
  const { t } = useI18n();
  const label =
    children ?? t(statusLabelKeys[status ?? "DRAFT"]);

  return (
    <span className={cn(tipsBadgeVariants({ status }), className)}>
      {liveDot || status === "OPEN" || status === "LIVE" ? (
        <span className="tips-live-dot size-1.5 rounded-full bg-[var(--tips-ice-highlight)]" />
      ) : null}
      {label}
    </span>
  );
}
