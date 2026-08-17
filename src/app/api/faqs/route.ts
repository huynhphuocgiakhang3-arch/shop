import { prisma } from "@/lib/prisma";
import { jsonOk } from "@/lib/api";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const DEFAULT_FAQS = [
  ["Tôi nhận sản phẩm bằng cách nào sau khi mua?", "Sau khi thanh toán thành công bằng số dư Wallet, sản phẩm sẽ xuất hiện ngay trong Vault/Tải xuống của tài khoản bạn."],
  ["KhangHuynh Vault hỗ trợ phương thức thanh toán nào?", "Khi mua sản phẩm, hệ thống sử dụng số dư Wallet đã nạp trước đó. Bạn có thể nạp tiền tại trang Nạp tiền."],
  ["Tôi có thể hoàn tiền nếu không hài lòng không?", "Bạn có thể gửi yêu cầu qua Trung tâm hỗ trợ để được kiểm tra theo chính sách của từng sản phẩm và trạng thái đơn hàng."],
  ["Thành viên VIP có những quyền lợi gì?", "Silver/Gold/Diamond có thể nhận ưu đãi riêng, ưu tiên hỗ trợ và quyền truy cập các sản phẩm VIP khi được cấu hình."],
  ["Quên mật khẩu thì làm sao?", "Dùng chức năng Quên mật khẩu tại trang đăng nhập. Hệ thống sẽ hướng dẫn khôi phục qua email."],
  ["Tôi cần gặp Admin?", "Bạn có thể mở Chat trực tiếp với Admin hoặc liên hệ Zalo Admin: 0775893691."]
] as const;
export async function GET() {
  try {
    const rows = await prisma.faqItem.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
    return jsonOk({ items: rows.length ? rows : DEFAULT_FAQS.map(([question, answer], i) => ({ id: `default-${i}`, question, answer, sortOrder: i, isActive: true })) });
  } catch (_error) { return jsonOk({ items: DEFAULT_FAQS.map(([question, answer], i) => ({ id: `default-${i}`, question, answer, sortOrder: i, isActive: true })) }); }
}
