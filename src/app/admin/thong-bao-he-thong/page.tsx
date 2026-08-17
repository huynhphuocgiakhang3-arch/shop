import { redirect } from "next/navigation";
import { getFreshSessionUser } from "@/lib/auth/session";
import { AnnouncementsClient } from "./AnnouncementsClient";

export default async function AdminAnnouncementsPage() {
  const user = await getFreshSessionUser();
  if (!user) redirect("/dang-nhap");
  // Mirrors api/admin/announcements: GET is requireAdmin, but POST/PATCH/
  // DELETE are requireSuperAdmin — a site-wide banner is broadcast to every
  // visitor, so only SUPER_ADMIN can create or edit one, same access model
  // as Appearance/System settings.
  if (user.role !== "SUPER_ADMIN") redirect("/admin");

  return <AnnouncementsClient />;
}
