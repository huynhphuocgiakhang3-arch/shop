import type { Metadata } from "next";

// Same reasoning as (auth)/dang-nhap/layout.tsx — transactional page,
// already disallowed in robots.ts, noindex here as a defense-in-depth backstop.
export const metadata: Metadata = {
  title: "Đăng ký",
  robots: { index: false, follow: true }
};

export default function DangKyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
