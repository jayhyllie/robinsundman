import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "~/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-[var(--tips-radius-sm,12px)] border border-[var(--tips-glass-border,rgba(245,245,245,0.09))] bg-[var(--tips-glass-bg,rgba(245,245,245,0.05))] px-4 py-2 font-[family-name:var(--tips-font-body,var(--font-geist-sans))] text-base text-[var(--tips-rink-white,#f5f5f5)] transition-[color,box-shadow,border-color] outline-none backdrop-blur-[20px] file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-[var(--tips-muted,rgba(245,245,245,0.55))] focus-visible:border-[var(--tips-club-lime,#a4c639)] focus-visible:ring-3 focus-visible:ring-[rgba(164,198,57,0.2)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
