import * as React from "react";

import { cn } from "~/lib/utils";

export function TipsInput({
  className,
  label,
  error,
  locked,
  readOnly,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  locked?: boolean;
}) {
  return (
    <label className="flex w-full flex-col gap-2">
      {label ? <span className="tips-label">{label}</span> : null}
      <input
        className={cn(
          "h-12 w-full rounded-[var(--tips-radius-sm)] border bg-[var(--tips-glass-bg)] px-4 font-[family-name:var(--tips-font-body)] text-base text-[var(--tips-rink-white)] outline-none backdrop-blur-[20px] transition placeholder:text-[var(--tips-muted)]",
          error
            ? "border-red-400/60 focus:border-red-400"
            : "border-[var(--tips-glass-border)] focus:border-[var(--tips-club-lime)] focus:shadow-[0_0_0_3px_rgba(164,198,57,0.2)]",
          locked && "opacity-60",
          className,
        )}
        readOnly={locked ? true : readOnly}
        {...props}
      />
      {error ? (
        <span className="text-xs font-medium text-red-400">{error}</span>
      ) : null}
    </label>
  );
}
