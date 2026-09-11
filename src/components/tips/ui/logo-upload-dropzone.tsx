"use client";

import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { useI18n } from "~/components/providers/i18n-provider";
import { cn } from "~/lib/utils";

export function LogoUploadDropzone({
  value,
  onUploaded,
  className,
}: {
  value?: string | null;
  onUploaded: (url: string) => void;
  className?: string;
}) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    const typeOk =
      ["image/png", "image/svg+xml"].includes(file.type) ||
      /\.(png|svg)$/i.test(file.name);
    if (!typeOk) {
      toast.error(t("tipsOnlyPngSvg"));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("tipsMax2Mb"));
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload/logo", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? t("tipsUploadFailed"));
      }
      const data = (await res.json()) as { url: string };
      onUploaded(data.url);
      toast.success(t("tipsLogoUploaded"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("tipsUploadFailed"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <button
      type="button"
      disabled={uploading}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) void handleFile(file);
      }}
      className={cn(
        "tips-glass flex w-full flex-col items-center justify-center gap-3 border-dashed px-6 py-10 text-center transition hover:bg-[--tips-glass-active]",
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt={t("tipsLogoAlt")} className="h-16 w-auto object-contain" />
      ) : (
        <Upload className="size-8 text-[--tips-club-lime]" />
      )}
      <div>
        <p className="text-sm font-bold text-[--tips-rink-white]">
          {uploading ? t("tipsUploading") : t("tipsDropCrest")}
        </p>
        <p className="mt-1 text-xs text-[--tips-muted]">
          {t("tipsLogoFormats")}
        </p>
      </div>
    </button>
  );
}
