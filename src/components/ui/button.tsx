import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "~/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 border border-transparent bg-clip-padding font-[family-name:var(--tips-font-body,var(--font-geist-sans))] text-sm font-extrabold tracking-[0.08em] uppercase whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "rounded-[var(--tips-radius-sm,12px)] bg-[linear-gradient(180deg,#b8d94a_0%,#a4c639_100%)] text-[var(--tips-arena-black,#0a120e)] shadow-[0_0_24px_rgba(164,198,57,0.35)] hover:brightness-110",
        outline:
          "rounded-[var(--tips-radius-sm,12px)] border-[var(--tips-glass-border,rgba(245,245,245,0.09))] bg-[var(--tips-glass-bg,rgba(245,245,245,0.05))] text-[var(--tips-rink-white,#f5f5f5)] backdrop-blur-[20px] hover:bg-[var(--tips-glass-active,rgba(164,198,57,0.12))]",
        secondary:
          "rounded-[var(--tips-radius-sm,12px)] border border-[var(--tips-glass-border,rgba(245,245,245,0.09))] bg-[var(--tips-glass-bg,rgba(245,245,245,0.05))] text-[var(--tips-rink-white,#f5f5f5)] hover:bg-[var(--tips-glass-active,rgba(164,198,57,0.12))]",
        ghost:
          "rounded-[var(--tips-radius-sm,12px)] hover:bg-[var(--tips-glass-active,rgba(164,198,57,0.12))] hover:text-foreground",
        destructive:
          "rounded-[var(--tips-radius-sm,12px)] bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-[var(--tips-club-lime,#a4c639)] underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-12 gap-2 px-6 has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5",
        xs: "h-7 gap-1 rounded-[min(var(--tips-radius-sm,12px),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 rounded-[var(--tips-radius-sm,12px)] px-4 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-14 gap-2 rounded-[var(--tips-radius-md,20px)] px-8 text-base has-data-[icon=inline-end]:pr-6 has-data-[icon=inline-start]:pl-6",
        icon: "size-10 rounded-[var(--tips-radius-sm,12px)]",
        "icon-xs":
          "size-6 rounded-[min(var(--tips-radius-sm,12px),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-8 rounded-[var(--tips-radius-sm,12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-11 rounded-[var(--tips-radius-sm,12px)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
