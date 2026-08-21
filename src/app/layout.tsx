import type { Metadata } from "next";
import { headers } from "next/headers";
import "@/styles/globals.css";
import { Providers } from "./providers";
import { getFreshSessionUser } from "@/lib/auth/session";
import { getSiteSettings } from "@/lib/settings";
import { MaintenancePage } from "@/components/maintenance/MaintenancePage";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { RouteTransition } from "@/components/layout/RouteTransition";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://khanghuynhvault.vercel.app").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "KhangHuynh Vault — Premium Digital Marketplace", template: "%s | KhangHuynh Vault" },
  description: "KhangHuynh Vault — marketplace sản phẩm số cao cấp với Wallet, giao hàng tức thì, Vault cá nhân và hỗ trợ trực tiếp.",
  applicationName: "KhangHuynh Vault",
  keywords: ["KhangHuynh Vault", "digital marketplace", "sản phẩm số", "shop file", "Vault", "phần mềm", "tài nguyên số"],
  alternates: { canonical: SITE_URL },
  openGraph: { type: "website", url: SITE_URL, siteName: "KhangHuynh Vault", locale: "vi_VN", title: "KhangHuynh Vault", description: "Premium digital marketplace với Wallet và giao hàng số tức thì." },
  twitter: { card: "summary_large_image", title: "KhangHuynh Vault", description: "Premium digital marketplace với Wallet và giao hàng số tức thì." },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  category: "shopping",
  classification: "Digital marketplace",
};

export const viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#05070c" };

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
    <html lang="vi" className="dark" suppressHydrationWarning>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            { "@type": "Organization", name: "KhangHuynh Vault", url: SITE_URL, logo: settings.logoUrl || `${SITE_URL}/favicon.svg` },
            { "@type": "WebSite", name: "KhangHuynh Vault", url: SITE_URL, potentialAction: { "@type": "SearchAction", target: `${SITE_URL}/san-pham?q={search_term_string}`, "query-input": "required name=search_term_string" } }
          ]
        }) }} />
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem(\"khv-theme\");var l=localStorage.getItem(\"khv-language\");if(t===\"light\")document.documentElement.classList.add(\"theme-light\");if(l===\"en\")document.documentElement.lang=\"en\";}catch(e){}})()` }} />{settings.faviconUrl ? <link rel="icon" href={settings.faviconUrl} /> : null}</head>
      <body className="font-body antialiased">
        <Providers>
          {showMaintenance ? (
            <MaintenancePage message={settings.maintenanceMessage} />
          ) : (
            <>
              <RouteTransition>{children}</RouteTransition>
              <SiteChrome />
            </>
          )}
        </Providers>
      </body>
    </html>
  );
}
