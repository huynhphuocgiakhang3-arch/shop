import { prisma } from "@/lib/prisma";
import { getPaymentSettings, isPaymentSettingsConfigured } from "@/lib/payment-settings";
import { EXPANDED_KEYWORDS, CORE_KEYWORD_TOKENS } from "@/lib/chat-keywords";
import { generateAiFallbackReply, isAiSupportConfigured } from "@/lib/ai-support";

export interface BotReply {
  body: string;
  handedOff: boolean;
}

type ChatProduct = { name: string; price: unknown; discountPrice: unknown };

const GROUPS = {
  greeting: ["xin chào", "chào", "hello", "hi", "alo", "hey", "good morning", "good evening"],
  deposit: ["nạp tiền", "nạp", "chuyển khoản", "qr", "bank", "ngân hàng", "thanh toán", "deposit", "nạp thẻ", "thẻ cào", "card", "mã thẻ"],
  balance: ["số dư", "còn bao nhiêu", "ví của tôi", "balance", "tài khoản tôi còn", "tiền trong ví"],
  product: ["sản phẩm", "sản phẩm nào", "có gì", "bán gì", "mua gì", "product", "shop", "catalog", "danh mục", "hàng"],
  price: ["giá", "bao nhiêu tiền", "giá bao nhiêu", "price", "rẻ", "giá sản phẩm"],
  order: ["đơn hàng", "order", "đã mua", "đơn của tôi", "mua rồi", "lịch sử mua"],
  download: ["tải", "download", "tải xuống", "file", "link tải", "đã mua sản phẩm"],
  membership: ["vip", "thành viên", "membership", "hạng", "silver", "gold", "diamond", "kim cương"],
  coupon: ["mã giảm giá", "coupon", "voucher", "khuyến mãi", "giảm giá", "code"],
  account: ["tài khoản", "đăng nhập", "đăng ký", "mật khẩu", "quên mật khẩu", "email", "avatar", "hồ sơ"],
  support: ["admin", "nhân viên", "hỗ trợ", "support", "liên hệ", "người thật", "gặp admin"],
  refund: ["hoàn tiền", "refund", "trả tiền", "hủy đơn", "khiếu nại"],
  security: ["bảo mật", "an toàn", "jwt", "mã hóa", "bảo vệ tài khoản", "hack"],
  music: ["nhạc", "music", "bài hát", "playlist"],
  contact: ["zalo", "0775893691", "liên hệ", "lien he", "contact"],
  faq: ["faq", "câu hỏi thường gặp", "cau hoi thuong gap", "trung tâm trợ giúp", "help center"],
  theme: ["giao diện sáng", "giao dien sang", "giao diện tối", "giao dien toi", "dark mode", "light mode", "đổi nền", "doi nen"],
  language: ["tiếng việt", "tieng viet", "tiếng anh", "tieng anh", "english", "vietnamese", "ngôn ngữ", "ngon ngu"],
  showcase: ["vault", "trưng bày", "trung bay", "showcase", "kho sản phẩm", "kho san pham"]
} as const;

function normalize(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").trim();
}

function matches(text: string, keys: readonly string[]) {
  return keys.some((key) => text.includes(normalize(key)));
}
const BROAD_KEYWORD_COUNT = EXPANDED_KEYWORDS.length;

function matchesBroadKeyword(text: string) {
  return text.split(/\s+/).some((token) => token.length >= 2 && CORE_KEYWORD_TOKENS.has(token));
}

async function productSummary() {
  const products: ChatProduct[] = await prisma.product.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ isFeatured: "desc" }, { salesCount: "desc" }],
    take: 6,
    select: { name: true, price: true, discountPrice: true }
  });
  if (!products.length) return "Hiện tại shop chưa có sản phẩm đang bán.";
  return products.map((product) => `• ${product.name} — ${Number(product.discountPrice ?? product.price).toLocaleString("vi-VN")}đ`).join("\n");
}

export async function generateBotReply(userId: string, rawMessage: string): Promise<BotReply> {
  const text = normalize(rawMessage);

  if (matches(text, GROUPS.greeting)) {
    return { body: "Chào bạn 👋 Mình có thể hỗ trợ về sản phẩm, giá, nạp tiền, số dư, đơn hàng, tải xuống, thành viên, mã giảm giá và các vấn đề tài khoản. Bạn cứ hỏi nhé!", handedOff: false };
  }

  if (matches(text, GROUPS.deposit)) {
    const settings = await getPaymentSettings();
    if (!isPaymentSettingsConfigured(settings)) return { body: "Khu vực thanh toán đang được cập nhật. Mình sẽ chuyển bạn tới Admin để hỗ trợ trực tiếp.", handedOff: true };
    return { body: `Bạn có thể nạp tiền tại trang “Nạp tiền”.\n• QR Banking: ${settings.bankName} — STK ${settings.accountNumber} — ${settings.accountName}${settings.transferContent ? `\n• Nội dung chuyển khoản: ${settings.transferContent}` : ""}\n• Thẻ cào/card: nhập thông tin theo biểu mẫu rồi chờ Admin duyệt.\nSau khi duyệt, số dư sẽ được cộng tự động.`, handedOff: false };
  }

  if (matches(text, GROUPS.balance)) {
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    return { body: `Số dư hiện tại: ${Number(wallet?.balance ?? 0).toLocaleString("vi-VN")}đ${wallet?.frozen ? " — ví đang tạm khóa, vui lòng liên hệ Admin." : "."}`, handedOff: false };
  }

  if (matches(text, GROUPS.product) || matches(text, GROUPS.price)) {
    const summary = await productSummary();
    return { body: `Các sản phẩm nổi bật hiện tại:\n${summary}\n\nBạn có thể mở trang “Sản phẩm” để xem đầy đủ thông tin, phiên bản và giá.`, handedOff: false };
  }

  if (matches(text, GROUPS.order)) {
    const orders = await prisma.order.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, status: true, totalAmount: true, createdAt: true } });
    if (!orders.length) return { body: "Bạn chưa có đơn hàng nào. Bạn có thể xem sản phẩm và bắt đầu mua sắm bất cứ lúc nào.", handedOff: false };
    return { body: `Bạn có ${orders.length} đơn gần đây:\n${orders.map((o: { id: string; status: string; totalAmount: unknown }) => `• #${o.id.slice(-8)} — ${o.status} — ${Number(o.totalAmount).toLocaleString("vi-VN")}đ`).join("\n")}\nBạn có thể vào mục “Đơn hàng” để xem chi tiết.`, handedOff: false };
  }

  if (matches(text, GROUPS.download)) {
    const count = await prisma.order.count({ where: { userId, status: "PAID" } });
    return { body: count ? `Bạn có ${count} đơn đã hoàn tất. Hãy mở mục “Tải xuống” để xem các file bạn đã mua.` : "Bạn chưa có đơn hoàn tất để tải xuống. Nếu bạn đã thanh toán mà chưa thấy file, hãy nhắn Admin để mình kiểm tra.", handedOff: !count };
  }

  if (matches(text, GROUPS.membership)) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { membershipTier: true, rewardPoints: true } });
    return { body: `Hạng hiện tại của bạn: ${user?.membershipTier ?? "FREE"}. Điểm thưởng: ${user?.rewardPoints ?? 0}. Nếu bạn muốn biết điều kiện nâng hạng, mình có thể chuyển Admin hỗ trợ chi tiết.`, handedOff: false };
  }

  if (matches(text, GROUPS.coupon)) {
    const coupons = await prisma.coupon.findMany({ where: { isActive: true, OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }] }, orderBy: { createdAt: "desc" }, take: 5, select: { code: true, discountType: true, discountValue: true } });
    return { body: coupons.length ? `Mã giảm giá đang hoạt động:\n${coupons.map((c: { code: string; discountType: string; discountValue: unknown }) => `• ${c.code} — ${c.discountType === "PERCENTAGE" ? `${Number(c.discountValue)}%` : `${Number(c.discountValue).toLocaleString("vi-VN")}đ`}`).join("\n")}` : "Hiện chưa có mã giảm giá công khai đang hoạt động.", handedOff: false };
  }

  if (matches(text, GROUPS.account)) return { body: "Bạn có thể quản lý hồ sơ, email, mật khẩu và thông tin tài khoản trong mục “Hồ sơ”. Nếu quên mật khẩu, dùng chức năng “Quên mật khẩu” tại trang đăng nhập.", handedOff: false };
  if (matches(text, GROUPS.security)) return { body: "Shop sử dụng cơ chế phiên đăng nhập và kiểm soát quyền ở phía máy chủ. Không gửi mật khẩu, mã OTP hoặc thông tin nhạy cảm cho bất kỳ ai trong chat.", handedOff: false };
  if (matches(text, GROUPS.music)) return { body: "Bạn có thể bật nhạc bằng nút Music ở góc dưới bên phải. Playlist do Super Admin quản lý và bài tiếp theo sẽ tự phát khi bài hiện tại kết thúc.", handedOff: false };
  if (matches(text, GROUPS.refund)) return { body: "Với yêu cầu hoàn tiền hoặc hủy đơn, mình sẽ chuyển cuộc trò chuyện tới Admin để kiểm tra trạng thái đơn và chính sách áp dụng.", handedOff: true };
  if (matches(text, GROUPS.contact)) return { body: "Bạn có thể liên hệ Admin qua Zalo: 0775893691 hoặc mở Chat trực tiếp với Admin ở góc dưới bên phải.", handedOff: false };
  if (matches(text, GROUPS.faq)) return { body: "Bạn có thể xem Trung tâm trợ giúp để tìm hướng dẫn về mua hàng, thanh toán, tải file, tài khoản và hỗ trợ. Nếu chưa đủ, mình sẽ chuyển Admin.", handedOff: false };
  if (matches(text, GROUPS.theme)) return { body: "Bạn có thể đổi giữa giao diện sáng và tối bằng nút giao diện trên thanh đầu trang. Thiết lập được lưu trên thiết bị để lần sau giữ nguyên.", handedOff: false };
  if (matches(text, GROUPS.language)) return { body: "Bạn có thể chuyển VI/EN bằng nút ngôn ngữ trên thanh đầu trang. Một số nội dung động sẽ giữ nguyên ngôn ngữ dữ liệu do Admin nhập.", handedOff: false };
  if (matches(text, GROUPS.showcase)) return { body: "Vault là khu trưng bày sản phẩm nổi bật, giúp bạn xem nhanh bộ sưu tập trước khi mở Marketplace hoặc trang chi tiết.", handedOff: false };
  if (matches(text, GROUPS.support)) return { body: "Mình đã sẵn sàng hỗ trợ. Nếu câu hỏi cần Admin xử lý trực tiếp, cuộc trò chuyện sẽ được đánh dấu để Admin tiếp nhận.", handedOff: true };

  if (matchesBroadKeyword(text)) return { body: `Mình đã nhận diện câu hỏi của bạn trong kho ${BROAD_KEYWORD_COUNT.toLocaleString("vi-VN")}+ biến thể từ khóa. Bạn có thể hỏi về sản phẩm, giá, thanh toán, đơn hàng, tải file, VIP, tài khoản, bảo mật hoặc hỗ trợ.`, handedOff: false };

  // Nothing in the keyword system matched. Previously this meant an
  // immediate hand-off to a human. If real-AI support is configured
  // (ANTHROPIC_API_KEY set — see src/lib/ai-support.ts), try that first;
  // it only ever replaces this one fallback path, never the fast/free/
  // data-grounded keyword answers above.
  if (isAiSupportConfigured()) {
    const aiReply = await generateAiFallbackReply(rawMessage);
    if (aiReply) return aiReply;
  }
  return { body: "Mình chưa tìm thấy từ khóa phù hợp. Bạn có thể hỏi về sản phẩm, giá, nạp tiền, QR, card/thẻ, số dư, đơn hàng, tải xuống, VIP, mã giảm giá, tài khoản hoặc nhắn “Admin” để được hỗ trợ trực tiếp.", handedOff: true };
}
