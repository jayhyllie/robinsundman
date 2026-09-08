"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";

import {
  applyBrandingColors,
  BRANDING_COLOR_DEFAULTS,
  type BrandingColors,
} from "~/lib/branding-colors";
import { api } from "~/trpc/react";

export type TenantBranding = {
  appName: string;
  challengeTag: string;
  taglineSv: string;
  taglineEn: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  clubName: string;
  clubShort: string;
  hashtag: string;
  footerText: string;
  homeBgImageUrl: string | null;
  joinBgImageUrl: string | null;
  quizBgImageUrl: string | null;
  nextMatchBgImageUrl: string | null;
} & BrandingColors;

const defaults: TenantBranding = {
  appName: "ÖIK BUSINESS CLUB",
  challengeTag: "CHALLENGE",
  taglineSv: "5 frågor – 10 sekunder per fråga – Tävla mot andra företag!",
  taglineEn: "5 questions – 10 seconds per question – Compete against companies!",
  ...BRANDING_COLOR_DEFAULTS,
  logoUrl: null,
  faviconUrl: null,
  clubName: "Östersunds IK",
  clubShort: "ÖIK",
  hashtag: "#VIÄRÖIK",
  footerText: "TILLSAMMANS ÄR VI STARKARE",
  homeBgImageUrl: null,
  joinBgImageUrl: null,
  quizBgImageUrl: null,
  nextMatchBgImageUrl: null,
};

const BrandingContext = createContext<TenantBranding>(defaults);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const { data } = api.tenant.get.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });

  const branding: TenantBranding = useMemo(
    () => (data ? { ...defaults, ...data } : defaults),
    [data],
  );

  useEffect(() => {
    applyBrandingColors(document.documentElement, {
      bgColor: branding.bgColor,
      primaryColor: branding.primaryColor,
      primaryBrightColor: branding.primaryBrightColor,
      accentColor: branding.accentColor,
      cardColor: branding.cardColor,
      borderColor: branding.borderColor,
      sidebarColor: branding.sidebarColor,
      borderRadius: branding.borderRadius,
    });
  }, [
    branding.bgColor,
    branding.primaryColor,
    branding.primaryBrightColor,
    branding.accentColor,
    branding.cardColor,
    branding.borderColor,
    branding.sidebarColor,
    branding.borderRadius,
  ]);

  return (
    <BrandingContext.Provider value={branding}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}
