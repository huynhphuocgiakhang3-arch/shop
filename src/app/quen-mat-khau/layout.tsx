import type { Metadata } from "next";

// Transactional account-recovery page — already excluded from sitemap.ts and
// disallowed in robots.ts; noindex here is a defense-in-depth backstop.
export const metadata: Metadata = {
  title: "Quên mật khẩu",
  robots: { index: false, follow: true }
};

export default function QuenMatKhauLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
