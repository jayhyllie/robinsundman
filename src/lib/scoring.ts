export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function formatPoints(points: number, locale: "sv" | "en"): string {
  const formatted = points.toLocaleString(locale === "sv" ? "sv-SE" : "en-US");
  return locale === "sv" ? `${formatted} p` : `${formatted} pts`;
}

export function calculateSpeedPoints(
  responseTimeMs: number,
  timeLimitMs: number,
): number {
  const remaining = Math.max(0, timeLimitMs - responseTimeMs);
  return Math.floor(1000 * (remaining / timeLimitMs));
}
