import type { ReactNode } from "react";
import Link from "next/link";
import type { VariantProps } from "class-variance-authority";

import { tipsButtonVariants } from "~/components/tips/ui/tips-button";
import { cn } from "~/lib/utils";

const variantMap = {
  default: "primary",
  outline: "secondary",
  secondary: "secondary",
  ghost: "tertiary",
  destructive: "secondary",
  link: "tertiary",
} as const;

type LinkButtonProps = {
  href: string;
  className?: string;
  children: ReactNode;
  variant?: VariantProps<typeof tipsButtonVariants>["variant"] | keyof typeof variantMap;
  size?: VariantProps<typeof tipsButtonVariants>["size"] | "icon" | "xs" | "icon-xs" | "icon-sm" | "icon-lg";
};

export function LinkButton({
  href,
  variant = "primary",
  size = "default",
  className,
  children,
}: LinkButtonProps) {
  const tipsVariant =
    variant && variant in variantMap
      ? variantMap[variant as keyof typeof variantMap]
      : ((variant as VariantProps<typeof tipsButtonVariants>["variant"]) ??
        "primary");

  const tipsSize =
    size === "icon" ||
    size === "xs" ||
    size === "icon-xs" ||
    size === "icon-sm" ||
    size === "icon-lg"
      ? "sm"
      : size;

  return (
    <Link
      href={href}
      className={cn(
        tipsButtonVariants({ variant: tipsVariant, size: tipsSize }),
        className,
      )}
    >
      {children}
    </Link>
  );
}
