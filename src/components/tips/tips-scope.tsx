import type { ReactNode } from "react";

import { cn } from "~/lib/utils";

export function TipsScope({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("tips-scope tips-bg min-h-svh", className)}>
      {children}
    </div>
  );
}
