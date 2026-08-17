import type { Metadata } from "next";
export const metadata: Metadata = { title: "Danh mục", description: "Khám phá các danh mục sản phẩm số trên KhangHuynh Vault.", alternates: { canonical: "/danh-muc" } };
export default function CategoryLayout({ children }: { children: React.ReactNode }) { return children; }
