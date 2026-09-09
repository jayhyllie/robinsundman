"use client";

import {
  Building2,
  Handshake,
  Home,
  Mail,
  Trophy,
} from "lucide-react";
import type { ReactNode } from "react";

import {
  AdminShell,
  type AdminNavItem,
} from "~/components/admin/admin-shell";
import { useI18n } from "~/components/providers/i18n-provider";

const navItems: AdminNavItem[] = [
  { href: "/admin/tips", labelKey: "tipsNavHome", icon: Home, exact: true },
  { href: "/admin/tips/matches", labelKey: "tipsNavMatches", icon: Trophy },
  { href: "/admin/tips/teams", labelKey: "tipsNavTeams", icon: Building2 },
  {
    href: "/admin/tips/sponsors",
    labelKey: "tipsNavSponsors",
    icon: Handshake,
  },
  {
    href: "/admin/tips/subscribers",
    labelKey: "tipsNavSubscribers",
    icon: Mail,
  },
];

export function TipsAdminShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();

  return (
    <AdminShell
      title={t("tipsPrediction")}
      navItems={navItems}
      storageKey="sidebar_admin_tips"
    >
      {children}
    </AdminShell>
  );
}
