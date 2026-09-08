import Image from "next/image";

import { cn } from "~/lib/utils";

const sizes = {
  sm: 34,
  md: 54,
  lg: 76,
} as const;

export function TeamCrest({
  name,
  logoUrl,
  size = "md",
  className,
}: {
  name: string;
  logoUrl?: string | null;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const px = sizes[size];
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--tips-glass-border)] bg-[var(--tips-glass-bg)]",
        className,
      )}
      style={{ width: px, height: px }}
      title={name}
    >
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={name}
          width={px}
          height={px}
          className="object-contain p-1"
          unoptimized
        />
      ) : (
        <span
          className="tips-display text-[var(--tips-club-lime)]"
          style={{ fontSize: px * 0.32 }}
        >
          {initials}
        </span>
      )}
    </div>
  );
}
