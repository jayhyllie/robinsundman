import { TipsAdminShell } from "~/components/tips/tips-admin-shell";

export default function TipsAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TipsAdminShell>{children}</TipsAdminShell>;
}
