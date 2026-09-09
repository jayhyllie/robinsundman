"use client";

import { Shield, Star } from "lucide-react";

import { useI18n } from "~/components/providers/i18n-provider";
import { useBranding } from "~/components/providers/branding-provider";
import { Button } from "~/components/ui/button";
import { LinkButton } from "~/components/ui/link-button";
import { cn } from "~/lib/utils";

export function AppFooter({ className }: { className?: string }) {
  const { t } = useI18n();
  const { footerText } = useBranding();

  return (
    <footer className={cn("border-t border-border-brand px-4 py-4", className)}>
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-xs text-gray-400 md:flex-row md:divide-x md:divide-border-brand">
        <div className="flex items-center gap-2 md:pr-4">
          <Shield className="h-3.5 w-3.5 text-primary" />
          <span className="tracking-wide uppercase">{t("competeAnswerWin")}</span>
        </div>
        <div className="hidden text-center md:block md:px-4">
          <span className="uppercase">{footerText}</span>
        </div>
        <div className="flex items-center gap-2 md:pl-4">
          <Star className="h-3.5 w-3.5 text-primary" />
          <span className="text-primary">{t("hashtag")}</span>
        </div>
      </div>
    </footer>
  );
}

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="flex items-center gap-2 text-sm md:text-base">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={`h-7 px-2 ${locale === "sv" ? "text-accent" : "text-muted-foreground"}`}
        onClick={() => setLocale("sv")}
      >
        SV
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={`h-7 px-2 ${locale === "en" ? "text-accent" : "text-muted-foreground"}`}
        onClick={() => setLocale("en")}
      >
        EN
      </Button>
    </div>
  );
}

export function AdminLink() {
  const { t } = useI18n();
  return (
    <LinkButton href="/admin" variant="outline" size="default">
      {t("admin")}
    </LinkButton>
  );
}
