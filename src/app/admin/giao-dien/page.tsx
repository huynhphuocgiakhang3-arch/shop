import { redirect } from "next/navigation";
import { getFreshSessionUser } from "@/lib/auth/session";
import { AppearanceSettingsClient } from "./AppearanceSettingsClient";

export default async function AdminAppearancePage() {
  const user = await getFreshSessionUser();
  if (!user) redirect("/dang-nhap");
  // Plain ADMIN cannot manage Appearance, Maintenance Mode, or system
  // settings — SUPER_ADMIN only, per the platform's access model.
  if (user.role !== "SUPER_ADMIN") redirect("/admin");

  return <AppearanceSettingsClient />;
}
