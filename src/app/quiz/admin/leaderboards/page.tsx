"use client";

import { toast } from "sonner";

import { localized, useI18n } from "~/components/providers/i18n-provider";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { api } from "~/trpc/react";

export default function AdminLeaderboardsPage() {
  const { t, locale } = useI18n();
  const utils = api.useUtils();

  const { data: periods } = api.leaderboard.getActivePeriods.useQuery();
  const { data: archivedPeriods } = api.leaderboard.listArchivedPeriods.useQuery();

  const ensureMutation = api.leaderboard.ensureDefaults.useMutation({
    onSuccess: () => void utils.leaderboard.getActivePeriods.invalidate(),
  });

  const resetMutation = api.leaderboard.reset.useMutation({
    onSuccess: () => {
      void utils.leaderboard.getActivePeriods.invalidate();
      void utils.leaderboard.listArchivedPeriods.invalidate();
      toast.success(t("archivePeriod"));
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("leaderboards")}</h1>
        <Button
          variant="outline"
          onClick={() => ensureMutation.mutate()}
          disabled={ensureMutation.isPending}
        >
          Init periods
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {periods?.map((period) => (
          <Card key={period.id}>
            <CardHeader>
              <CardTitle>
                {localized(locale, period.nameSv, period.nameEn)}
              </CardTitle>
              <CardDescription>{period.type}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                {period.companyScores.length} companies ·{" "}
                {period.playerScores.length} players
              </div>
              {period.lastResetAt && (
                <p className="text-xs text-muted-foreground">
                  Last reset: {period.lastResetAt.toLocaleString()}
                </p>
              )}
              <Button
                variant="destructive"
                onClick={() => resetMutation.mutate({ periodId: period.id })}
                disabled={resetMutation.isPending}
              >
                {t("archivePeriod")}
              </Button>
            </CardContent>
          </Card>
        ))}
        {periods?.length === 0 && (
          <p className="text-muted-foreground">{t("noData")}</p>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">{t("archivedPeriods")}</h2>
        {!archivedPeriods || archivedPeriods.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noArchivedPeriods")}</p>
        ) : (
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("title")}</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Period</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {archivedPeriods.map((period) => (
                  <TableRow key={period.id}>
                    <TableCell className="font-medium">
                      {localized(locale, period.nameSv, period.nameEn)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {period.type}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {period.startsAt?.toLocaleDateString(locale === "sv" ? "sv-SE" : "en-US")}
                      {" – "}
                      {period.endsAt?.toLocaleDateString(locale === "sv" ? "sv-SE" : "en-US")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
