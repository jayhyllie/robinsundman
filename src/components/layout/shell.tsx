"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarClock,
  ChartNoAxesColumnIncreasing,
  Gamepad2,
  Home,
  Info,
  Trophy,
} from "lucide-react";

import { useI18n } from "~/components/providers/i18n-provider";
import type { TranslationKey } from "~/i18n/translations";
import { AdminLink, AppFooter, LanguageSwitcher } from "~/components/ui/footer";
import { HeroBackground } from "~/components/ui/hero-background";
import { OikLogo } from "~/components/ui/logo";
import { NextMatchWidget } from "~/components/ui/next-match-widget";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "~/components/ui/sidebar";
import { TooltipProvider } from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";

export function MobileShell({
  children,
  className,
  bgImage,
  showLogo = true,
}: {
  children: React.ReactNode;
  className?: string;
  bgImage?: string | null;
  showLogo?: boolean;
}) {
  return (
    <div className="tips-scope tips-bg relative isolate min-h-screen">
      <HeroBackground imageUrl={bgImage} />
      <div className={cn("mobile-only relative z-10 flex min-h-screen flex-col px-4 py-6", className)}>
        <div className="mb-4 flex items-center justify-between">
          <OikLogo showLogo={showLogo} />
          <LanguageSwitcher />
        </div>
        {children}
        <AppFooter />
      </div>
    </div>
  );
}

const navItems: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: TranslationKey;
  // Several of these placeholder items share a real destination (there's no
  // dedicated page for them yet) — only one item per href should ever look
  // "active" or every duplicate would light up together.
  matchActive?: boolean;
}[] = [
  { href: "/quiz", icon: Home, labelKey: "home", matchActive: true },
  { href: "/quiz/live", icon: Gamepad2, labelKey: "playQuiz", matchActive: true },
  { href: "/quiz", icon: ChartNoAxesColumnIncreasing, labelKey: "results", matchActive: false },
  { href: "/quiz/leaderboard", icon: Trophy, labelKey: "leaderboards", matchActive: true },
  { href: "/quiz", icon: CalendarClock, labelKey: "previousMatches", matchActive: false },
  { href: "/quiz", icon: Info, labelKey: "about", matchActive: false },
];

function PublicNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {navItems.map(({ href, icon: Icon, labelKey, matchActive }, i) => {
            const isActive =
              !!matchActive &&
              (href === "/quiz"
                ? pathname === "/quiz"
                : href === "/quiz/leaderboard"
                  ? pathname.startsWith("/quiz/leaderboard")
                  : pathname === href || pathname.startsWith(`${href}/`));
            const label = t(labelKey);

            return (
              <SidebarMenuItem key={`${href}-${i}`}>
                <SidebarMenuButton
                  render={<Link href={href} />}
                  isActive={isActive}
                  tooltip={label}
                  onClick={() => {
                    if (isMobile) setOpenMobile(false);
                  }}
                  className="uppercase tracking-wide data-active:bg-[var(--tips-club-lime)] data-active:text-[var(--tips-arena-black)] data-active:hover:bg-[var(--tips-club-lime)]/90 data-active:hover:text-[var(--tips-arena-black)]"
                >
                  <Icon />
                  <span>{label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function PublicSidebar() {
  const { state } = useSidebar();
  return (
    <Sidebar collapsible="icon" >
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center gap-2 overflow-hidden group-data-[collapsible=icon]:justify-center">
          <OikLogo className="group-data-[collapsible=icon]:scale-75" showLogo={state === "expanded"} />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <PublicNav />
      </SidebarContent>

      <SidebarFooter className="gap-1 md:gap-3 pb-3 md:pb-4">
        <SidebarSeparator className="group-data-[collapsible=icon]:hidden" />
        <div className="group-data-[collapsible=icon]:hidden">
          <NextMatchWidget />
        </div>
        <section className="flex items-center justify-between gap-2">
          <div className="px-2 group-data-[collapsible=icon]:hidden">
            <AdminLink />
          </div>
          <div className="px-2 group-data-[collapsible=icon]:hidden">
            <LanguageSwitcher />
          </div>
        </section>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export function SidebarShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="tips-scope tips-bg h-svh">
      <TooltipProvider>
        <SidebarProvider
          storageKey="sidebar_public"
          className="h-svh min-h-0 overflow-hidden"
        >
          <PublicSidebar />
          <SidebarInset className="min-h-0 overflow-hidden bg-transparent">
            <header className="flex h-14 shrink-0 items-center gap-2 border-b border-[var(--tips-glass-border)] px-4">
              <SidebarTrigger className="-ml-1" />
            </header>
            <main className="min-h-0 flex-1 overflow-y-auto">
              {children}
            </main>
            <AppFooter className="shrink-0" />
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </div>
  );
}
