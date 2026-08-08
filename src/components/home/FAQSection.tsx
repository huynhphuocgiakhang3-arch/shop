"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { RevealSection } from "./RevealSection";

const FAQS = [
  {
    q: "Tôi nhận sản phẩm bằng cách nào sau khi mua?",
    a: "Sau khi thanh toán thành công, liên kết tải xuống sẽ xuất hiện ngay trong mục Tải xuống của tài khoản bạn."
  },
  {
    q: "KhangHuynh Vault hỗ trợ những phương thức thanh toán nào?",
    a: "Ví nội bộ, chuyển khoản ngân hàng, và các cổng thanh toán phổ biến. Một số phương thức cần xác nhận thủ công."
  },
  {
    q: "Tôi có thể hoàn tiền nếu không hài lòng không?",
    a: "Có. Vui lòng gửi yêu cầu qua Trung tâm hỗ trợ trong vòng 7 ngày kể từ ngày mua để được xem xét hoàn tiền."
  },
  {
    q: "Thành viên VIP có những quyền lợi gì?",
    a: "Thành viên Silver/Gold/Diamond được giảm giá độc quyền, ưu tiên hỗ trợ và quyền truy cập sản phẩm VIP-only."
  }
];

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <RevealSection className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-8">
      <h2 className="mb-8 text-center text-h2 font-display text-white">Câu hỏi thường gặp</h2>
      <div className="flex flex-col gap-3">
        {FAQS.map((item, i) => (
          <div key={item.q} className="glass-surface overflow-hidden rounded-md">
            <button
              type="button"
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between px-5 py-4 text-left text-title text-white/90"
              aria-expanded={open === i}
            >
              {item.q}
              <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`} />
            </button>
            {open === i && <p className="px-5 pb-4 text-small text-white/55">{item.a}</p>}
          </div>
        ))}
      </div>
    </RevealSection>
  );
}
