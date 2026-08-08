import type { Metadata } from "next";
import { headers } from "next/headers";
import "@/styles/globals.css";
import { Providers } from "./providers";
import { getFreshSessionUser } from "@/lib/auth/session";
import { getSiteSettings } from "@/lib/settings";
import { MaintenancePage } from "@/components/maintenance/MaintenancePage";
import { SiteChrome } from "@/components/layout/SiteChrome";

export const metadata: Metadata = {
  title: "KhangHuynh Vault — Premium Digital Marketplace",
  description: "Nền tảng thương mại số cao cấp: sản phẩm số, tài khoản, phần mềm và dịch vụ."
};

// The login page must always stay reachable — otherwise a logged-out
// SUPER_ADMIN could never sign in to turn Maintenance Mode back off.
const MAINTENANCE_BYPASS_PATHS = ["/dang-nhap"];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = headers().get("x-pathname") ?? "";
  const settings = await getSiteSettings();

  let showMaintenance = false;
  if (settings.maintenanceMode && !MAINTENANCE_BYPASS_PATHS.includes(pathname)) {
    const user = await getFreshSessionUser();
    showMaintenance = !user || user.role !== "SUPER_ADMIN";
  }

  return (
    <html lang="vi" className="dark">
      <head>{settings.faviconUrl ? <link rel="icon" href={settings.faviconUrl} /> : null}</head>
      <body className="font-body antialiased">
        <Providers>
          {showMaintenance ? (
            <MaintenancePage message={settings.maintenanceMessage} />
          ) : (
            <>
              {children}
              <SiteChrome />
            </>
          )}
        </Providers>
      </body>
    </html>
  );
}
