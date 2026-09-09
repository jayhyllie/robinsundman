"use client";

import { Minus, Plus } from "lucide-react";

import { useI18n } from "~/components/providers/i18n-provider";
import { cn } from "~/lib/utils";

export function ScoreStepper({
  label,
  value,
  onChange,
  min = 0,
  max = 20,
  className,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  className?: string;
}) {
  const { t } = useI18n();

  return (
    <div className={cn("flex min-w-0 flex-1 flex-col items-center gap-2", className)}>
      <span className="tips-label">{label}</span>
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          aria-label={`${t("tipsIncreaseScore")} ${label}`}
          className="flex size-10 items-center justify-center rounded-full border border-[--tips-glass-border] bg-[--tips-glass-bg] text-[--tips-rink-white] transition hover:bg-[--tips-glass-active] disabled:opacity-30"
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
        >
          <Plus className="size-5" />
        </button>
        <span className="tips-display text-center text-5xl text-[--tips-rink-white] tabular-nums">
          {value}
        </span>
        <button
          type="button"
          aria-label={`${t("tipsDecreaseScore")} ${label}`}
          className="flex size-10 items-center justify-center rounded-full border border-[--tips-glass-border] bg-[--tips-glass-bg] text-[--tips-rink-white] transition hover:bg-[--tips-glass-active] disabled:opacity-30"
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
        >
          <Minus className="size-5" />
        </button>
      </div>
    </div>
  );
}
