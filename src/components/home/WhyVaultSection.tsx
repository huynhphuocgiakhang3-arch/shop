import { BadgeCheck, Download, HeartHandshake, LockKeyhole, Sparkles, Zap } from "lucide-react";
import { RevealSection } from "./RevealSection";

const FEATURES = [
  { icon: Zap, title: "Giao hàng tức thì", text: "Sau khi mua thành công, tài sản được cấp quyền trực tiếp vào Vault." },
  { icon: LockKeyhole, title: "Secure Vault", text: "Tài sản đã mua được gom về một không gian riêng, rõ ràng và dễ quản lý." },
  { icon: BadgeCheck, title: "Verified Products", text: "Catalog được tổ chức theo trạng thái, phiên bản và thông tin sản phẩm." },
  { icon: Download, title: "Update ready", text: "Theo dõi phiên bản và truy cập lại tài sản mà không phải tìm lại lịch sử đơn hàng." },
  { icon: HeartHandshake, title: "Premium Support", text: "Chat, ticket và hướng dẫn hỗ trợ được đưa về một trung tâm duy nhất." },
  { icon: Sparkles, title: "Một trải nghiệm thống nhất", text: "Marketplace, Wallet, Vault, Wishlist và Account kết nối thành một hệ sinh thái." }
];

export function WhyVaultSection() {
  return (
    <RevealSection className="mx-auto w-full max-w-[1380px] px-4 py-16 sm:px-8 lg:py-24">
      <div className="mb-9 max-w-2xl">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[.2em] text-accent-orange">Why Vault</p>
        <h2 className="text-h2 font-display font-semibold tracking-[-.035em] text-white">Không chỉ bán file. Xây một nơi để sở hữu.</h2>
        <p className="mt-3 text-small leading-7 text-white/45">Mỗi điểm chạm đều được thiết kế để giảm ma sát, tăng niềm tin và khiến khách hàng cảm thấy tài sản số của họ thực sự thuộc về một hệ thống.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, text }, index) => (
          <div key={title} className="group glass-surface relative overflow-hidden rounded-[26px] p-6">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-accent-orange/[.07] blur-3xl transition duration-700 group-hover:bg-accent-orange/[.14]" />
            <div className="relative flex items-start justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-accent-orange/15 bg-accent-orange/[.07] text-accent-orange"><Icon className="h-5 w-5" /></span>
              <span className="text-[10px] font-bold tracking-[.18em] text-white/20">0{index + 1}</span>
            </div>
            <h3 className="relative mt-7 text-[17px] font-semibold text-white">{title}</h3>
            <p className="relative mt-2 text-small leading-6 text-white/40">{text}</p>
          </div>
        ))}
      </div>
    </RevealSection>
  );
}
