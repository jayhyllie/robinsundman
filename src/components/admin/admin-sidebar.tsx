"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Gamepad2,
  Home,
  Library,
  Palette,
  Trophy,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";

import { useI18n } from "~/components/providers/i18n-provider";
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
import { CLERK_ENABLED } from "~/lib/auth-mode";

const navItems = [
  { href: "/quiz/admin", icon: Home, labelKey: "home" as const },
  { href: "/quiz/admin/quizzes", icon: Gamepad2, labelKey: "quizzes" as const },
  { href: "/quiz/admin/companies", icon: Building2, labelKey: "companies" as const },
  { href: "/quiz/admin/questions", icon: Library, labelKey: "questionBank" as const },
  { href: "/quiz/admin/leaderboards", icon: Trophy, labelKey: "leaderboards" as const },
  { href: "/quiz/admin/branding", icon: Palette, labelKey: "branding" as const },
];

function AdminNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {navItems.map(({ href, icon: Icon, labelKey }) => {
            const isActive =
              href === "/quiz/admin"
                ? pathname === "/quiz/admin"
                : pathname.startsWith(href);
            const label = t(labelKey).toLocaleUpperCase();

            return (
              <SidebarMenuItem key={href}>
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

function AdminSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center gap-2 overflow-hidden group-data-[collapsible=icon]:justify-center">
          <OikLogo className="group-data-[collapsible=icon]:scale-75" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <AdminNav />
      </SidebarContent>

      <SidebarFooter className="gap-3 pb-4">
        <div className="group-data-[collapsible=icon]:hidden">
          <NextMatchWidget />
        </div>
        {CLERK_ENABLED && (
          <>
            <SidebarSeparator />
            <div className="flex items-center px-2 group-data-[collapsible=icon]:justify-center">
              <UserButton />
            </div>
          </>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="tips-scope tips-bg h-svh">
      <TooltipProvider>
        <SidebarProvider
          storageKey="sidebar_admin"
          className="h-svh min-h-0 overflow-hidden"
        >
          <AdminSidebar />
          <SidebarInset className="min-h-0 overflow-hidden bg-transparent">
            <header className="flex h-14 shrink-0 items-center gap-2 border-b border-[var(--tips-glass-border)] px-4">
              <SidebarTrigger className="-ml-1" />
              <div className="md:hidden">
                <OikLogo className="scale-90" />
              </div>
              {CLERK_ENABLED && (
                <div className="ml-auto flex items-center gap-2 md:hidden">
                  <UserButton />
                </div>
              )}
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </div>
  );
}
