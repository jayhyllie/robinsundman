"use client";

import { UserButton } from "@clerk/nextjs";
import {
  Building2,
  Handshake,
  Home,
  Mail,
  Medal,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { TipsScope } from "~/components/tips/tips-scope";
import { CLERK_ENABLED } from "~/lib/auth-mode";
import { cn } from "~/lib/utils";

const nav = [
  { href: "/tips/admin", label: "Home", icon: Home, exact: true },
  { href: "/tips/admin/matches", label: "Matches", icon: Trophy },
  { href: "/tips/admin/teams", label: "Teams", icon: Building2 },
  { href: "/tips/admin/sponsors", label: "Sponsors", icon: Handshake },
  { href: "/tips/admin/subscribers", label: "Subscribers", icon: Mail },
];

export function TipsAdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <TipsScope className="flex min-h-svh">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-[--tips-glass-border] bg-black/30 p-4 md:flex">
        <div className="mb-8 px-2">
          <p className="tips-label">Sundman</p>
          <p className="tips-display text-2xl">Prediction</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {nav.map(({ href, label, icon: Icon, exact }) => {
            const active = exact
              ? pathname === href
              : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-[--tips-radius-sm] px-3 py-2.5 text-sm font-bold tracking-wide uppercase transition",
                  active
                    ? "bg-[--tips-club-lime] text-[--tips-arena-black]"
                    : "text-[--tips-muted] hover:bg-[--tips-glass-bg] hover:text-[--tips-rink-white]",
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <Link
          href="/quiz/admin"
          className="mt-4 flex items-center gap-2 px-2 text-xs text-[--tips-muted] hover:text-[--tips-club-lime]"
        >
          <Medal className="size-3.5" /> Quiz admin
        </Link>
        {CLERK_ENABLED ? (
          <div className="mt-4 px-2">
            <UserButton />
          </div>
        ) : null}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 overflow-x-auto border-b border-[--tips-glass-border] px-4 py-3 md:hidden">
          {nav.map(({ href, label, exact }) => {
            const active = exact
              ? pathname === href
              : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold tracking-wide uppercase",
                  active
                    ? "bg-[--tips-club-lime] text-[--tips-arena-black]"
                    : "bg-[--tips-glass-bg] text-[--tips-muted]",
                )}
              >
                {label}
              </Link>
            );
          })}
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-8">{children}</main>
      </div>
    </TipsScope>
  );
}
