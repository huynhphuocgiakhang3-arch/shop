import { redirect } from "next/navigation";
import { getFreshSessionUser } from "@/lib/auth/session";
import { AuditLogClient } from "./AuditLogClient";

export default async function AdminAuditLogPage() {
  const user = await getFreshSessionUser();
  if (!user) redirect("/dang-nhap");
  // Matches api/admin/audit-log's requireSuperAdmin — this surfaces every
  // admin's actions across the platform, same access tier as Appearance/
  // System settings and Announcements.
  if (user.role !== "SUPER_ADMIN") redirect("/admin");

  return <AuditLogClient />;
}
