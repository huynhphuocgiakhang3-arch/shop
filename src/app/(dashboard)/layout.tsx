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
    // `flex-col` on mobile / `lg:flex-row` on desktop. This is the actual
    // fix for the "text wraps into a single vertical column" bug: on
    // mobile, DashboardSidebar returns a Fragment with two sibling divs
    // (a `hidden lg:block` desktop rail + a `lg:hidden` mobile top bar).
    // With a plain `flex` (row) container, that mobile top bar becomes a
    // ROW flex item sitting next to the content wrapper below instead of
    // stacking above it — since it has no explicit width, it claims most
    // of the row by its own content size, squeezing `flex-1 min-w-0`
    // content into a sliver only a few pixels wide, which is exactly what
    // forces every heading/paragraph inside to wrap one character per line.
    <div className="flex min-h-screen flex-col bg-bg-primary lg:flex-row">
      <DashboardSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader />
        <main className="khv-dashboard-content khv-has-bottom-nav min-w-0 flex-1 px-4 py-6 page-enter sm:px-6 sm:py-8">{children}</main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
