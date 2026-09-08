import type { ReactNode } from "react";
import Link from "next/link";
import type { VariantProps } from "class-variance-authority";

import {
  tipsButtonVariants,
} from "~/components/tips/ui/tips-button";
import { cn } from "~/lib/utils";

type TipsLinkButtonProps = VariantProps<typeof tipsButtonVariants> & {
  href: string;
  className?: string;
  children: ReactNode;
  target?: string;
};

/** Link styled as TipsButton — use for quiz/tips CTAs. */
export function TipsLinkButton({
  href,
  variant = "primary",
  size = "default",
  className,
  children,
  target,
}: TipsLinkButtonProps) {
  return (
    <Link
      href={href}
      target={target}
      className={cn(tipsButtonVariants({ variant, size }), className)}
    >
      {children}
    </Link>
  );
}
