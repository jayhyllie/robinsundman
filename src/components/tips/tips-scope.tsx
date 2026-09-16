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
    <div className={cn("tips-scope bg-[#144729] min-h-svh", className)}>
      {children}
    </div>
  );
}
