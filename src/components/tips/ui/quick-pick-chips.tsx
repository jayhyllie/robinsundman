"use client";

import { cn } from "~/lib/utils";

const DEFAULT_PICKS = [
  { home: 3, away: 2 },
  { home: 4, away: 1 },
  { home: 2, away: 2 },
  { home: 5, away: 2 },
];

export function QuickPickChips({
  picks = DEFAULT_PICKS,
  selected,
  onSelect,
  className,
}: {
  picks?: { home: number; away: number }[];
  selected?: { home: number; away: number } | null;
  onSelect: (home: number, away: number) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {picks.map((p) => {
        const active =
          selected?.home === p.home && selected?.away === p.away;
        return (
          <button
            key={`${p.home}-${p.away}`}
            type="button"
            onClick={() => onSelect(p.home, p.away)}
            className={cn(
              "rounded-[--tips-radius-pill] border px-4 py-2 font-[--tips-font-display] text-lg tracking-wide transition",
              active
                ? "border-[--tips-club-lime] bg-[--tips-glass-active] text-[--tips-ice-highlight]"
                : "border-[--tips-glass-border] bg-[--tips-glass-bg] text-[--tips-rink-white] hover:bg-[--tips-glass-active]",
            )}
          >
            {p.home}–{p.away}
          </button>
        );
      })}
    </div>
  );
}
