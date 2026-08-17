import { redirect } from "next/navigation";
import { getFreshSessionUser } from "@/lib/auth/session";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getFreshSessionUser();
  if (!user) redirect("/dang-nhap");
  if (user.isBanned) redirect("/dang-nhap");

  return (
    <div className="flex min-h-screen bg-bg-primary">
      <DashboardSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader />
        <main className="khv-dashboard-content khv-has-bottom-nav min-w-0 flex-1 px-4 py-6 page-enter sm:px-6 sm:py-8">{children}</main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
