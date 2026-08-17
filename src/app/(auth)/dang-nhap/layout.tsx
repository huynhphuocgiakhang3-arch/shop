import type { Metadata } from "next";

// Transactional page, not content — indexing it just clutters search results
// with a login form. Already disallowed in robots.ts too; the meta tag here
// is a defense-in-depth backstop in case the route is ever reached through a
// path robots.txt doesn't cover (e.g. a future alias or an external link).
export const metadata: Metadata = {
  title: "Đăng nhập",
  robots: { index: false, follow: true }
};

export default function DangNhapLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
