import { redirect } from "next/navigation";
import { getFreshSessionUser } from "@/lib/auth/session";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Reads the role straight from Postgres — if a SUPER_ADMIN demotes this
  // user in Neon, the very next navigation/refresh into /admin bounces them
  // out immediately, without waiting for their access token to expire.
  const user = await getFreshSessionUser();
  if (!user) redirect("/dang-nhap");
  if (user.isBanned) redirect("/trang-chu");
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") redirect("/trang-chu");

  return (
    <div className="flex min-h-screen bg-bg-primary">
      <AdminSidebar />
      <main className="min-w-0 flex-1 px-8 py-8">{children}</main>
    </div>
  );
}
