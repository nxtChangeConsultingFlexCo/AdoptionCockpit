import { requireRole } from "@/lib/auth/roles";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["god"], "/admin");
  return <>{children}</>;
}
