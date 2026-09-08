"use client";

import { useEffect, useState } from "react";
import { Palette } from "lucide-react";
import { toast } from "sonner";

import { useBranding } from "~/components/providers/branding-provider";
import { Button } from "~/components/ui/button";
import { BrandingColorField } from "~/components/admin/branding-color-field";
import {
  applyBrandingColors,
  BRANDING_COLOR_DEFAULTS,
  BORDER_RADIUS_VALUE,
  COLOR_VALUE,
  formatBorderRadius,
  HEX_COLOR,
  parseBorderRadiusPx,
} from "~/lib/branding-colors";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { api } from "~/trpc/react";

type FormState = {
  appName: string;
  challengeTag: string;
  taglineSv: string;
  taglineEn: string;
  bgColor: string;
  primaryColor: string;
  primaryBrightColor: string;
  accentColor: string;
  cardColor: string;
  borderColor: string;
  sidebarColor: string;
  borderRadius: string;
  logoUrl: string;
  faviconUrl: string;
  clubName: string;
  clubShort: string;
  hashtag: string;
  footerText: string;
  homeBgImageUrl: string;
  joinBgImageUrl: string;
  quizBgImageUrl: string;
  nextMatchBgImageUrl: string;
};

type ColorField = {
  key: keyof Pick<
    FormState,
    | "bgColor"
    | "primaryColor"
    | "primaryBrightColor"
    | "accentColor"
    | "cardColor"
    | "borderColor"
    | "sidebarColor"
  >;
  label: string;
  cssVar: string;
  supportsAlpha?: boolean;
};

const colorFields: ColorField[] = [
  { key: "bgColor", label: "Primär mörk", cssVar: "--color-primary-dark" },
  { key: "primaryColor", label: "Primär", cssVar: "--color-primary" },
  {
    key: "primaryBrightColor",
    label: "Primär ljust",
    cssVar: "--color-primary-bright",
  },
  { key: "accentColor", label: "Accent", cssVar: "--color-accent" },
  {
    key: "cardColor",
    label: "Yta (glass card)",
    cssVar: "--color-surface",
    supportsAlpha: true,
  },
  {
    key: "borderColor",
    label: "Kant brand",
    cssVar: "--color-border-brand",
    supportsAlpha: true,
  },
  {
    key: "sidebarColor",
    label: "Sidofält bakgrund",
    cssVar: "--color-sidebar",
  },
];

export default function BrandingPage() {
  const branding = useBranding();
  const utils = api.useUtils();

  const [form, setForm] = useState<FormState>({
    appName: "",
    challengeTag: "",
    taglineSv: "",
    taglineEn: "",
    ...BRANDING_COLOR_DEFAULTS,
    logoUrl: "",
    faviconUrl: "",
    clubName: "",
    clubShort: "",
    hashtag: "",
    footerText: "",
    homeBgImageUrl: "",
    joinBgImageUrl: "",
    quizBgImageUrl: "",
    nextMatchBgImageUrl: "",
  });

  useEffect(() => {
    setForm({
      appName: branding.appName,
      challengeTag: branding.challengeTag,
      taglineSv: branding.taglineSv,
      taglineEn: branding.taglineEn,
      primaryColor: branding.primaryColor,
      primaryBrightColor: branding.primaryBrightColor,
      accentColor: branding.accentColor,
      bgColor: branding.bgColor,
      cardColor: branding.cardColor,
      borderColor: branding.borderColor,
      sidebarColor: branding.sidebarColor,
      borderRadius: branding.borderRadius,
      logoUrl: branding.logoUrl ?? "",
      faviconUrl: branding.faviconUrl ?? "",
      clubName: branding.clubName,
      clubShort: branding.clubShort,
      hashtag: branding.hashtag,
      footerText: branding.footerText,
      homeBgImageUrl: branding.homeBgImageUrl ?? "",
      joinBgImageUrl: branding.joinBgImageUrl ?? "",
      quizBgImageUrl: branding.quizBgImageUrl ?? "",
      nextMatchBgImageUrl: branding.nextMatchBgImageUrl ?? "",
    });
  }, [branding]);

  useEffect(() => {
    applyBrandingColors(document.documentElement, {
      bgColor: form.bgColor,
      primaryColor: form.primaryColor,
      primaryBrightColor: form.primaryBrightColor,
      accentColor: form.accentColor,
      cardColor: form.cardColor,
      borderColor: form.borderColor,
      sidebarColor: form.sidebarColor,
      borderRadius: form.borderRadius,
    });
  }, [form]);

  const updateMutation = api.tenant.update.useMutation({
    onSuccess: () => {
      void utils.tenant.get.invalidate();
      toast.success("Branding updated!");
    },
    onError: (e) => toast.error(e.message),
  });

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = () => {
    updateMutation.mutate({
      appName: form.appName || undefined,
      challengeTag: form.challengeTag || undefined,
      taglineSv: form.taglineSv || undefined,
      taglineEn: form.taglineEn || undefined,
      primaryColor: HEX_COLOR.test(form.primaryColor) ? form.primaryColor : undefined,
      primaryBrightColor: HEX_COLOR.test(form.primaryBrightColor)
        ? form.primaryBrightColor
        : undefined,
      accentColor: HEX_COLOR.test(form.accentColor) ? form.accentColor : undefined,
      bgColor: HEX_COLOR.test(form.bgColor) ? form.bgColor : undefined,
      cardColor: COLOR_VALUE.test(form.cardColor) ? form.cardColor : undefined,
      borderColor: COLOR_VALUE.test(form.borderColor) ? form.borderColor : undefined,
      sidebarColor: COLOR_VALUE.test(form.sidebarColor) ? form.sidebarColor : undefined,
      borderRadius: BORDER_RADIUS_VALUE.test(form.borderRadius)
        ? form.borderRadius
        : undefined,
      logoUrl: form.logoUrl || null,
      faviconUrl: form.faviconUrl || null,
      clubName: form.clubName || undefined,
      clubShort: form.clubShort || undefined,
      hashtag: form.hashtag || undefined,
      footerText: form.footerText || undefined,
      homeBgImageUrl: form.homeBgImageUrl || null,
      joinBgImageUrl: form.joinBgImageUrl || null,
      quizBgImageUrl: form.quizBgImageUrl || null,
      nextMatchBgImageUrl: form.nextMatchBgImageUrl || null,
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Palette className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Branding & White-label</h1>
          <p className="text-sm text-muted-foreground">
            Customize the look and feel for each installation.
          </p>
        </div>
      </div>

      {/* Live preview */}
      <Card className="border-primary/30 bg-linear-to-br from-primary/10 to-transparent">
        <CardContent className="py-6 text-center">
          <div
            className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border-2 text-xl font-bold"
            style={{ borderColor: form.accentColor, color: form.accentColor, background: form.primaryColor + "20" }}
          >
            {form.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.logoUrl} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              form.clubShort || "?"
            )}
          </div>
          <p className="text-xl font-extrabold tracking-wider" style={{ color: "white" }}>
            {form.appName}{" "}
            <span style={{ color: form.accentColor, fontStyle: "italic" }}>
              {form.challengeTag}
            </span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{form.taglineSv}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Club identity</CardTitle>
          <CardDescription>Displayed in the logo and page titles.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Club name (full)</Label>
              <Input value={form.clubName} onChange={set("clubName")} placeholder="Östersunds IK" />
            </div>
            <div className="space-y-2">
              <Label>Club short name</Label>
              <Input value={form.clubShort} onChange={set("clubShort")} placeholder="ÖIK" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Logo URL</Label>
            <Input value={form.logoUrl} onChange={set("logoUrl")} placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <Label>Favicon URL</Label>
            <Input value={form.faviconUrl} onChange={set("faviconUrl")} placeholder="https://..." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>App title & tagline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>App name (e.g. BUSINESS CLUB)</Label>
              <Input value={form.appName} onChange={set("appName")} />
            </div>
            <div className="space-y-2">
              <Label>Challenge tag (e.g. CHALLENGE)</Label>
              <Input value={form.challengeTag} onChange={set("challengeTag")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tagline (Swedish)</Label>
            <Input value={form.taglineSv} onChange={set("taglineSv")} />
          </div>
          <div className="space-y-2">
            <Label>Tagline (English)</Label>
            <Input value={form.taglineEn} onChange={set("taglineEn")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Hashtag</Label>
              <Input value={form.hashtag} onChange={set("hashtag")} placeholder="#VIÄRÖIK" />
            </div>
            <div className="space-y-2">
              <Label>Footer text</Label>
              <Input value={form.footerText} onChange={set("footerText")} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Background images</CardTitle>
          <CardDescription>
            Full-bleed photos shown behind the public screens. Leave empty to use the plain dark background.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(
            [
              ["homeBgImageUrl", "Startsidan (home)"],
              ["joinBgImageUrl", "Anslut- & väntesida (join & lobby)"],
              ["quizBgImageUrl", "Quiz-sidan (active question)"],
              ["nextMatchBgImageUrl", "Nästa match (widget & promo)"],
            ] as [keyof FormState, string][]
          ).map(([key, label]) => (
            <div key={key} className="flex items-center gap-3">
              {form[key] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form[key]}
                  alt=""
                  className="h-12 w-20 shrink-0 rounded object-cover ring-1 ring-border"
                />
              ) : (
                <div className="h-12 w-20 shrink-0 rounded bg-muted ring-1 ring-border" />
              )}
              <div className="flex-1 space-y-2">
                <Label>{label}</Label>
                <Input value={form[key]} onChange={set(key)} placeholder="https://..." />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Colors & layout</CardTitle>
          <CardDescription>
            All colors have a picker. Surface and border also have an opacity slider. Border
            radius applies to buttons, cards, inputs and other rounded UI. Changes apply live.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {colorFields.map(({ key, label, cssVar, supportsAlpha }) => (
              <BrandingColorField
                key={key}
                label={label}
                cssVar={cssVar}
                value={form[key]}
                placeholder={BRANDING_COLOR_DEFAULTS[key]}
                supportsAlpha={supportsAlpha}
                onChange={(value) => setForm((f) => ({ ...f, [key]: value }))}
              />
            ))}
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <Label>
              Rundade hörn{" "}
              <span className="font-mono text-[10px] text-muted-foreground">--radius</span>
            </Label>
            <div className="flex items-center gap-4">
              <div
                className="h-16 w-16 shrink-0 border-2 border-primary bg-primary/20"
                style={{ borderRadius: form.borderRadius }}
              />
              <div className="flex flex-1 flex-col gap-2">
                <input
                  type="range"
                  min={0}
                  max={32}
                  value={parseBorderRadiusPx(form.borderRadius)}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      borderRadius: formatBorderRadius(Number(e.target.value)),
                    }))
                  }
                  className="h-2 w-full cursor-pointer accent-primary"
                  aria-label="Border radius"
                />
                <div className="flex items-center gap-2">
                  <Input
                    value={form.borderRadius}
                    onChange={set("borderRadius")}
                    className="font-mono text-xs"
                    placeholder={BRANDING_COLOR_DEFAULTS.borderRadius}
                  />
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {parseBorderRadiusPx(form.borderRadius)}px
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Button
        onClick={handleSave}
        disabled={updateMutation.isPending}
        className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
      >
        {updateMutation.isPending ? "Saving…" : "Save branding"}
      </Button>
    </div>
  );
}
