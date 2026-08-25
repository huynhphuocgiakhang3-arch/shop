import { redirect } from "next/navigation";
import { getFreshSessionUser } from "@/lib/auth/session";
import { SuperAdminControlClient } from "./SuperAdminControlClient";

export const dynamic = "force-dynamic";

export default async function SuperAdminControlPage() {
  const user = await getFreshSessionUser();
  if (!user || user.role !== "SUPER_ADMIN") redirect("/admin");
  return <SuperAdminControlClient />;
}
