"use client";

import { useEffect, useState } from "react";

import { useI18n } from "~/components/providers/i18n-provider";
import { cn } from "~/lib/utils";

const SIZE = 96;
const STROKE = 4;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function QuizTimer({
  endsAt,
  totalSeconds = 10,
  className,
}: {
  endsAt: string | null;
  totalSeconds?: number;
  className?: string;
}) {
  const { t } = useI18n();
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!endsAt) {
      setSecondsLeft(totalSeconds);
      setProgress(100);
      return;
    }

    const tick = () => {
      const remaining = Math.max(
        0,
        Math.ceil((new Date(endsAt).getTime() - Date.now()) / 1000),
      );
      setSecondsLeft(remaining);
      setProgress((remaining / totalSeconds) * 100);
    };

    tick();
    const interval = setInterval(tick, 100);
    return () => clearInterval(interval);
  }, [endsAt, totalSeconds]);

  const strokeDashoffset = CIRCUMFERENCE * (1 - progress / 100);

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-primary-dark/30 shadow-[0_0_25px_rgba(164,198,57,0.55)] backdrop-blur-sm">
        <svg
          className="absolute inset-0"
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          aria-hidden
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE}
            className="text-primary/25"
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            className="text-primary-bright transition-[stroke-dashoffset] duration-100 ease-linear"
          />
        </svg>
        <div className="relative z-10 text-center">
          <div className="text-3xl font-bold text-white">{secondsLeft}</div>
          <div className="text-[10px] font-semibold tracking-wider text-primary uppercase">
            {t("seconds")}
          </div>
        </div>
      </div>
    </div>
  );
}
