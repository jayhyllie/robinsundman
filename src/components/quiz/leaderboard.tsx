"use client";

import { ChevronRight, Star, Trophy } from "lucide-react";

import { useI18n } from "~/components/providers/i18n-provider";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { TipsLinkButton } from "~/components/tips/ui";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { RANK_COLORS } from "~/lib/constants";
import { formatPoints } from "~/lib/scoring";
import { cn } from "~/lib/utils";
import type { LeaderboardEntry } from "~/lib/socket-events";

type LeaderboardProps = {
  entries: LeaderboardEntry[];
  title?: string;
  viewAllHref?: string;
  compact?: boolean;
  horizontal?: boolean;
  className?: string;
};

export function Leaderboard({
  entries,
  title,
  viewAllHref,
  compact = false,
  horizontal = false,
  className,
  limit,
}: LeaderboardProps & { limit?: number }) {
  const { locale, t } = useI18n();
  const visible = typeof limit === "number" ? entries.slice(0, limit) : entries;

  if (horizontal) {
    return (
      <Card className={cn("glass-card border-primary/30", className)}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="tips-label text-[--tips-rink-white]! flex items-center gap-2 normal-case tracking-[0.12em]">
            <Star className="h-5 w-5 shrink-0 text-[--tips-trophy-gold]" />
            {title ?? t("top5Now")}
          </CardTitle>
          {viewAllHref && (
            <TipsLinkButton variant="secondary" size="sm" href={viewAllHref}>
              {t("viewFullLeaderboard")} <ChevronRight className="h-4 w-4 shrink-0" />
            </TipsLinkButton>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {visible.slice(0, 5).map((entry) => (
              <div
                key={entry.id}
                className="flex flex-col items-center rounded-lg border border-border/50 bg-card/50 p-3 text-center"
              >
                <Badge
                  variant="outline"
                  className={cn("mb-2", RANK_COLORS[entry.rank])}
                >
                  {entry.rank}
                </Badge>
                <Avatar className="mb-2 h-10 w-10">
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {entry.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="text-xs font-semibold">{entry.name}</div>
                <div className="text-[10px] text-muted-foreground">
                  {entry.company}
                </div>
                <div
                  className={cn(
                    "mt-2 text-lg font-bold",
                    RANK_COLORS[entry.rank],
                  )}
                >
                  {formatPoints(entry.points, locale)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("glass-card border-primary/30", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="tips-label text-[--tips-rink-white]! flex items-center gap-2 normal-case tracking-[0.12em]">
          <Star className="h-5 w-5 shrink-0 text-[--tips-trophy-gold]" />
          {title ?? t("top5Now")}
        </CardTitle>
        {viewAllHref && (
          <TipsLinkButton variant="secondary" size="sm" href={viewAllHref}>
            {t("viewAll")} <ChevronRight className="h-4 w-4 shrink-0" />
          </TipsLinkButton>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {visible.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("noData")}</p>
        )}
        {visible.map((entry) => (
          <div
            key={entry.id}
            className={cn(
              "flex items-center gap-3 rounded-lg border border-border/40 p-2",
              !compact && "p-3",
            )}
          >
            <span className={cn("w-6 font-bold text-primary", entry.rank === 1 && "text-accent", entry.rank === 2 && "text-gray-600", entry.rank === 3 && "text-orange-500")}>
              {entry.rank}
            </span>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/20 text-xs text-primary">
                {entry.initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{entry.name}</div>
              <div className="truncate text-xs text-muted-foreground">
                {entry.company}
              </div>
            </div>
            <div
              className={cn("font-bold", RANK_COLORS[entry.rank] ?? "text-primary")}
            >
              {formatPoints(entry.points, locale)}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function CompanyLeaderboard({
  entries,
  title,
  subtitle,
  viewAllHref,
  className,
  limit,
}: {
  entries: { rank: number; name: string; points: number; logoUrl?: string | null }[];
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  className?: string;
  limit?: number;
}) {
  const { locale, t } = useI18n();
  const visible = typeof limit === "number" ? entries.slice(0, limit) : entries;

  return (
    <Card className={cn("glass-card border-primary/30", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 shrink-0 text-[--tips-trophy-gold]" />
          <div>
            <CardTitle className="tips-label text-[--tips-rink-white]! normal-case tracking-[0.12em]">
              {title}
            </CardTitle>
            {subtitle && (
              <p className="tips-label mt-1 text-[--tips-club-lime]!">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {viewAllHref && (
          <TipsLinkButton variant="secondary" size="sm" href={viewAllHref}>
            {t("viewFullTable")} <ChevronRight className="h-4 w-4 shrink-0" />
          </TipsLinkButton>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {visible.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("noData")}</p>
        )}
        {visible.map((entry) => (
          <div
            key={entry.name}
            className={cn(
              "flex items-center gap-3 rounded-lg border border-border/40 p-2",
              entry.rank === 1 && "border-accent/40 bg-accent/5",
            )}
          >
            <span className={cn("w-6 text-lg font-bold text-primary", entry.rank === 1 && "text-accent", entry.rank === 2 && "text-gray-500", entry.rank === 3 && "text-orange-500")}>
              {entry.rank}
            </span>
            <span className="flex-1 truncate text-sm font-semibold uppercase">
              {entry.name}
            </span>
            <span className="font-bold text-white/80 text-lg">
              {formatPoints(entry.points, locale)}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
