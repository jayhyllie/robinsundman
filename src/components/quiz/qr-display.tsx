"use client";

import { QRCodeSVG } from "qrcode.react";

import { useI18n } from "~/components/providers/i18n-provider";
import { TipsGlassCard } from "~/components/tips/ui";

export function QrDisplay({
  url,
  size = 160,
}: {
  url: string;
  size?: number;
}) {
  const { t } = useI18n();

  return (
    <TipsGlassCard className="flex flex-col items-center gap-4">
      <div className="rounded-[var(--tips-radius-md)] bg-white p-4">
        <QRCodeSVG value={url} size={size} />
      </div>
      <p className="tips-label text-center">{t("scanQr")}</p>
    </TipsGlassCard>
  );
}
