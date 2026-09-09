"use client";

import { UserButton } from "@clerk/nextjs";
import type { LucideIcon } from "lucide-react";
import { Medal } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { useI18n } from "~/components/providers/i18n-provider";
import { TipsScope } from "~/components/tips/tips-scope";
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
import type { TranslationKey } from "~/i18n/translations";
import { CLERK_ENABLED } from "~/lib/auth-mode";

export type AdminNavItem = {
  href: string;
  labelKey: TranslationKey;
  icon: LucideIcon;
  exact?: boolean;
};

function AdminNav({ items }: { items: AdminNavItem[] }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map(({ href, icon: Icon, labelKey, exact }) => {
            const isActive = exact
              ? pathname === href
              : pathname === href || pathname.startsWith(`${href}/`);
            const label = t(labelKey);

            return (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton
                  render={<Link href={href} />}
                  isActive={isActive}
                  tooltip={label}
                  onClick={() => {
                    if (isMobile) setOpenMobile(false);
                  }}
                  className="uppercase tracking-wide text-[--tips-muted] hover:bg-[--tips-glass-bg] hover:text-[--tips-rink-white] data-active:bg-[--tips-club-lime] data-active:text-[--tips-arena-black] data-active:hover:bg-[--tips-club-lime]/90 data-active:hover:text-[--tips-arena-black]"
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

function AdminSidebar({
  title,
  navItems,
}: {
  title: string;
  navItems: AdminNavItem[];
}) {
  const { t } = useI18n();

  return (
    <Sidebar
      collapsible="icon"
      className="border-[--tips-glass-border] bg-transparent [&_[data-slot=sidebar-inner]]:bg-black/40"
    >
      <SidebarHeader className="px-3 py-4">
        <div className="overflow-hidden px-1 group-data-[collapsible=icon]:hidden">
          <p className="tips-label">Sundman</p>
          <p className="tips-display text-2xl leading-none">{title}</p>
        </div>
        <div className="hidden items-center justify-center group-data-[collapsible=icon]:flex">
          <span className="tips-display text-lg text-[--tips-club-lime]">
            {title.slice(0, 1)}
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <AdminNav items={navItems} />
      </SidebarContent>

      <SidebarFooter className="gap-2 pb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/admin" />}
              tooltip={t("tipsAdminHub")}
              className="text-[--tips-muted] hover:bg-[--tips-glass-bg] hover:text-[--tips-club-lime]"
            >
              <Medal />
              <span>{t("tipsAdminHub")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {CLERK_ENABLED ? (
          <>
            <SidebarSeparator className="bg-[--tips-glass-border]" />
            <div className="flex items-center px-2 group-data-[collapsible=icon]:justify-center">
              <UserButton />
            </div>
          </>
        ) : null}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export function AdminShell({
  title,
  navItems,
  storageKey,
  children,
}: {
  title: string;
  navItems: AdminNavItem[];
  storageKey: string;
  children: ReactNode;
}) {
  return (
    <TipsScope className="tips-bg h-svh">
      <TooltipProvider>
        <SidebarProvider
          storageKey={storageKey}
          className="h-svh min-h-0 overflow-hidden"
        >
          <AdminSidebar title={title} navItems={navItems} />
          <SidebarInset className="min-h-0 overflow-hidden bg-transparent">
            <header className="flex h-14 shrink-0 items-center gap-2 border-b border-[--tips-glass-border] px-4">
              <SidebarTrigger className="-ml-1 text-[--tips-rink-white] hover:bg-[--tips-glass-bg] hover:text-[--tips-club-lime]" />
              <div className="min-w-0 md:hidden">
                <p className="tips-label truncate">Sundman</p>
                <p className="tips-display truncate text-lg leading-none">
                  {title}
                </p>
              </div>
              {CLERK_ENABLED ? (
                <div className="ml-auto flex items-center gap-2 md:hidden">
                  <UserButton />
                </div>
              ) : null}
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-8">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </TipsScope>
  );
}
