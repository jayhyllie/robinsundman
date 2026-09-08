import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "~/lib/utils";

const tipsButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-[family-name:var(--tips-font-body)] font-extrabold uppercase tracking-[0.08em] transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary:
          "bg-[linear-gradient(180deg,#b8d94a_0%,#a4c639_100%)] text-[var(--tips-arena-black)] shadow-[0_0_24px_rgba(164,198,57,0.35)] hover:brightness-110 active:translate-y-px",
        secondary:
          "border border-[var(--tips-glass-border)] bg-[var(--tips-glass-bg)] text-[var(--tips-rink-white)] backdrop-blur-[20px] hover:bg-[var(--tips-glass-active)]",
        tertiary:
          "bg-transparent text-[var(--tips-club-lime)] underline-offset-4 hover:underline",
        gold:
          "bg-[linear-gradient(180deg,#ffe566_0%,#ffd700_100%)] text-[var(--tips-arena-black)] shadow-[0_0_24px_rgba(255,215,0,0.35)] hover:brightness-105",
      },
      size: {
        default: "h-12 rounded-[var(--tips-radius-sm)] px-6 text-sm",
        lg: "h-14 rounded-[var(--tips-radius-md)] px-8 text-base",
        sm: "h-9 rounded-[var(--tips-radius-sm)] px-4 text-xs",
        pill: "h-11 rounded-[var(--tips-radius-pill)] px-6 text-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export function TipsButton({
  className,
  variant,
  size,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof tipsButtonVariants>) {
  return (
    <button
      className={cn(tipsButtonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { tipsButtonVariants };
