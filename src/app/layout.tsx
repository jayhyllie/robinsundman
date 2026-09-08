import { ClerkProvider } from "@clerk/nextjs";
import { type Metadata, type Viewport } from "next";
import { Archivo, Barlow_Condensed, Geist, Permanent_Marker } from "next/font/google";

import { BrandingProvider } from "~/components/providers/branding-provider";
import { I18nProvider } from "~/components/providers/i18n-provider";
import { CLERK_ENABLED } from "~/lib/auth-mode";
import { Toaster } from "~/components/ui/sonner";
import { TRPCReactProvider } from "~/trpc/react";
import "~/styles/globals.css";
import "~/styles/tips-design.css";

export const metadata: Metadata = {
  title: "ÖIK Business Club Challenge",
  description: "Real-time quiz for Östersunds IK Business Club",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a120e",
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const marker = Permanent_Marker({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-permanent-marker",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-barlow-condensed",
});

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-archivo",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const app = (
    <html
      lang="sv"
      className={`dark ${geist.variable} ${marker.variable} ${barlowCondensed.variable} ${archivo.variable}`}
    >
      <body className="min-h-screen bg-background text-foreground antialiased">
        <TRPCReactProvider>
          <BrandingProvider>
            <I18nProvider>
              {children}
              <Toaster richColors position="top-center" />
            </I18nProvider>
          </BrandingProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );

  return CLERK_ENABLED ? <ClerkProvider>{app}</ClerkProvider> : app;
}
