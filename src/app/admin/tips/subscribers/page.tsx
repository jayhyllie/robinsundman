"use client";

import { toast } from "sonner";

import { useI18n } from "~/components/providers/i18n-provider";
import {
  TipsButton,
  TipsGlassCard,
} from "~/components/tips/ui";
import { api } from "~/trpc/react";

export default function SubscribersAdminPage() {
  const { t } = useI18n();
  const subscribers = api.tips.marketingSubscribers.useQuery();

  function exportCsv() {
    const rows = subscribers.data ?? [];
    if (rows.length === 0) {
      toast.error(t("tipsNoSubscribersExport"));
      return;
    }
    const header = "email,playerName,marketingConsentAt";
    const body = rows
      .map((r) => {
        const at = r.marketingConsentAt
          ? new Date(r.marketingConsentAt).toISOString()
          : "";
        const name = `"${r.playerName.replace(/"/g, '""')}"`;
        return `${r.email},${name},${at}`;
      })
      .join("\n");
    const blob = new Blob([`${header}\n${body}\n`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tips-newsletter-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("tipsCsvExported"));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="tips-label">{t("tipsExport")}</p>
          <h1 className="tips-display text-5xl">{t("tipsNewsletterConsent")}</h1>
          <p className="mt-2 text-sm text-[--tips-muted]">
            {t("tipsSubscribersHint")}
          </p>
        </div>
        <TipsButton
          variant="gold"
          onClick={exportCsv}
          disabled={!subscribers.data?.length}
        >
          {t("tipsExportCsv")}
        </TipsButton>
      </div>

      <TipsGlassCard>
        <p className="tips-label mb-3">
          {subscribers.data?.length ?? 0} {t("tipsSubscribersCount")}
        </p>
        <div className="max-h-112 space-y-2 overflow-auto">
          {subscribers.data?.map((s) => (
            <div
              key={s.email}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-[--tips-glass-border] py-2 text-sm"
            >
              <div>
                <p className="font-bold">{s.email}</p>
                <p className="text-[--tips-muted]">{s.playerName}</p>
              </div>
              <span className="text-xs text-[--tips-muted]">
                {s.marketingConsentAt
                  ? new Date(s.marketingConsentAt).toLocaleString("sv-SE")
                  : "—"}
              </span>
            </div>
          ))}
          {(subscribers.data?.length ?? 0) === 0 ? (
            <p className="text-sm text-[--tips-muted]">
              {t("tipsNoConsentsYet")}
            </p>
          ) : null}
        </div>
      </TipsGlassCard>
    </div>
  );
}
