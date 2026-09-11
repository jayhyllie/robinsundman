"use client";

import { useEffect, useMemo, useState } from "react";

import { useI18n } from "~/components/providers/i18n-provider";
import { cn } from "~/lib/utils";

function pad(n: number) {
  return String(Math.max(0, n)).padStart(2, "0");
}

function diffParts(target: Date) {
  const ms = Math.max(0, target.getTime() - Date.now());
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return { days, hours, minutes, seconds, done: ms <= 0 };
}

export function CountdownBlocks({
  target,
  className,
  compact,
}: {
  target: Date | string;
  className?: string;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const end = useMemo(
    () => (typeof target === "string" ? new Date(target) : target),
    [target],
  );
  const [parts, setParts] = useState(() => diffParts(end));

  useEffect(() => {
    setParts(diffParts(end));
    const id = setInterval(() => setParts(diffParts(end)), 1000);
    return () => clearInterval(id);
  }, [end]);

  const blocks = compact
    ? [
        { label: t("tipsHrs"), value: pad(parts.days * 24 + parts.hours) },
        { label: t("tipsMin"), value: pad(parts.minutes) },
        { label: t("tipsSec"), value: pad(parts.seconds) },
      ]
    : [
        { label: t("tipsDays"), value: pad(parts.days) },
        { label: t("tipsHrs"), value: pad(parts.hours) },
        { label: t("tipsMin"), value: pad(parts.minutes) },
        { label: t("tipsSec"), value: pad(parts.seconds) },
      ];

  return (
    <div className={cn("flex gap-2", className)}>
      {blocks.map((b) => (
        <div
          key={b.label}
          className="tips-glass flex min-w-17 flex-1 flex-col items-center px-2 py-3"
        >
          <span className="tips-display text-9xl tabular-nums text-[--tips-rink-white]">
            {b.value}
          </span>
          <span className="mt-1 text-[20px] font-bold tracking-[0.16em] text-[--tips-muted] uppercase">
            {b.label}
          </span>
        </div>
      ))}
    </div>
  );
}
