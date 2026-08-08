import { redirect } from "next/navigation";
import { getFreshSessionUser } from "@/lib/auth/session";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getFreshSessionUser();
  if (!user) redirect("/dang-nhap");
  if (user.isBanned) redirect("/dang-nhap");

  return (
    <div className="flex min-h-screen bg-bg-primary">
      <DashboardSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader />
        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
