"use client";
import { useEffect, useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { RevealSection } from "./RevealSection";

type FAQ = { id: string; question: string; answer: string };
const FALLBACK: FAQ[] = [
  { id: "1", question: "Tôi nhận sản phẩm bằng cách nào sau khi mua?", answer: "Sau khi thanh toán thành công bằng số dư Wallet, sản phẩm sẽ xuất hiện ngay trong Vault/Tải xuống của tài khoản bạn." },
  { id: "2", question: "KhangHuynh Vault hỗ trợ phương thức thanh toán nào?", answer: "Khi mua sản phẩm, hệ thống sử dụng số dư Wallet đã nạp trước đó. Bạn có thể nạp tiền tại trang Nạp tiền." },
  { id: "3", question: "Tôi có thể hoàn tiền nếu không hài lòng không?", answer: "Bạn có thể gửi yêu cầu qua Trung tâm hỗ trợ để được kiểm tra theo chính sách của từng sản phẩm và trạng thái đơn hàng." },
  { id: "4", question: "Thành viên VIP có những quyền lợi gì?", answer: "Silver/Gold/Diamond có thể nhận ưu đãi riêng, ưu tiên hỗ trợ và quyền truy cập các sản phẩm VIP khi được cấu hình." },
  { id: "5", question: "Quên mật khẩu thì làm sao?", answer: "Dùng chức năng Quên mật khẩu tại trang đăng nhập. Hệ thống sẽ hướng dẫn khôi phục qua email." },
  { id: "6", question: "Tôi cần gặp Admin?", answer: "Bạn có thể mở Chat trực tiếp với Admin hoặc liên hệ Zalo Admin: 0775893691." }
];

export function FAQSection() {
  const [items, setItems] = useState<FAQ[]>(FALLBACK);
  const [open, setOpen] = useState(0);
  useEffect(() => { fetch("/api/faqs", { cache: "no-store" }).then(r => r.ok ? r.json() : null).then(data => { if (data?.items?.length) setItems(data.items); }).catch(() => undefined); }, []);
  return <RevealSection id="faq" className="faq-mobile-tight mx-auto w-full max-w-6xl px-4 py-20 sm:px-8"><div className="mb-9"><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent-orange/20 bg-accent-orange/[.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-accent-orange"><HelpCircle className="h-3.5 w-3.5"/> Support</div><h2 className="text-h2 font-display text-white">Câu hỏi thường gặp</h2><p className="mt-2 max-w-xl text-small text-white/40">Câu trả lời ngắn gọn cho những điều bạn cần biết trước và sau khi mua.</p></div><div className="grid gap-3 lg:grid-cols-2">{items.map((item,i)=><div key={item.id} className="glass-surface overflow-hidden rounded-lg"><button type="button" onClick={()=>setOpen(open===i?-1:i)} className="flex min-h-[72px] w-full items-center justify-between gap-4 px-5 py-4 text-left text-title text-white/90" aria-expanded={open===i}><span>{item.question}</span><ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open===i?"rotate-180":""}`}/></button>{open===i&&<p className="px-5 pb-5 text-small leading-7 text-white/50">{item.answer}</p>}</div>)}</div></RevealSection>;
}
