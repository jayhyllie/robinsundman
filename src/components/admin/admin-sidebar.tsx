"use client";

import {
  Building2,
  Gamepad2,
  Home,
  Library,
  Palette,
  Trophy,
} from "lucide-react";
import type { ReactNode } from "react";

import {
  AdminShell,
  type AdminNavItem,
} from "~/components/admin/admin-shell";
import { useI18n } from "~/components/providers/i18n-provider";

const navItems: AdminNavItem[] = [
  { href: "/admin/quiz", icon: Home, labelKey: "home", exact: true },
  { href: "/admin/quiz/quizzes", icon: Gamepad2, labelKey: "quizzes" },
  { href: "/admin/quiz/companies", icon: Building2, labelKey: "companies" },
  {
    href: "/admin/quiz/questions",
    icon: Library,
    labelKey: "questionBank",
  },
  {
    href: "/admin/quiz/leaderboards",
    icon: Trophy,
    labelKey: "leaderboards",
  },
  { href: "/admin/quiz/branding", icon: Palette, labelKey: "branding" },
];

export function AdminLayoutShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();

  return (
    <AdminShell
      title={t("quizzes")}
      navItems={navItems}
      storageKey="sidebar_admin_quiz"
    >
      {children}
    </AdminShell>
  );
}
