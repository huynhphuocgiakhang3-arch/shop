import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

const LINKS = {
  "Sản phẩm": [
    { label: "Marketplace", href: "/san-pham" },
    { label: "Danh mục", href: "/danh-muc" },
    { label: "Thành viên VIP", href: "/thanh-vien" }
  ],
  "Hỗ trợ": [
    { label: "Trung tâm trợ giúp", href: "/ho-tro" },
    { label: "Câu hỏi thường gặp", href: "/#faq" },
    { label: "Liên hệ", href: "/lien-he" }
  ],
  "Tài khoản": [
    { label: "Đăng nhập", href: "/dang-nhap" },
    { label: "Đăng ký", href: "/dang-ky" },
    { label: "Quên mật khẩu", href: "/quen-mat-khau" }
  ]
};

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 px-4 py-14 sm:px-8">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-10 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <Logo />
          <p className="mt-4 text-small text-white/40">Nền tảng thương mại số cao cấp.</p>
        </div>
        {Object.entries(LINKS).map(([heading, links]) => (
          <div key={heading}>
            <h4 className="mb-3 text-small font-semibold text-white/70">{heading}</h4>
            <ul className="flex flex-col gap-2">
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-small text-white/45 hover:text-white/80">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-10 max-w-7xl border-t border-white/5 pt-6 text-caption text-white/30">
        © {new Date().getFullYear()} KhangHuynh Vault. Đã đăng ký bản quyền.
      </div>
    </footer>
  );
}
