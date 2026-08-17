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
      <main className="khv-admin-content min-w-0 flex-1 overflow-x-hidden px-4 py-6 page-enter sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
