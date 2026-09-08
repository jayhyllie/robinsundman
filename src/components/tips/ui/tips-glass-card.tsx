import type { HTMLAttributes } from "react";

import { cn } from "~/lib/utils";

export function TipsGlassCard({
  className,
  active,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { active?: boolean }) {
  return (
    <div
      className={cn(
        "tips-glass p-5",
        active && "tips-glass-active",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
