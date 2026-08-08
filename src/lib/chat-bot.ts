import { prisma } from "@/lib/prisma";
import { getPaymentSettings, isPaymentSettingsConfigured } from "@/lib/payment-settings";

export interface BotReply {
  body: string;
  /** True when no rule matched — conversation flips to needsHuman so the admin queue picks it up. */
  handedOff: boolean;
}

const DEPOSIT_KEYWORDS = ["nạp tiền", "nạp", "chuyển khoản", "qr", "thẻ cào", "nạp thẻ", "deposit"];
const PRODUCT_KEYWORDS = ["sản phẩm", "có gì", "bán gì", "mua gì", "product", "shop"];
const BALANCE_KEYWORDS = ["số dư", "còn bao nhiêu", "ví của tôi", "balance", "tài khoản tôi còn"];
const ORDER_KEYWORDS = ["đơn hàng", "order", "đã mua"];

/** Shape selected from Product by the chatbot query. */
type ChatProduct = {
  name: string;
  price: unknown;
  discountPrice: unknown;
};

function normalize(text: string) {
  return text.toLowerCase().normalize("NFC");
}

function matchesAny(text: string, keywords: string[]) {
  return keywords.some((k) => text.includes(k));
}

/**
 * Every branch here reads the actual current row (PaymentSettings, Product,
 * Wallet, Order) at answer time — nothing is templated from static copy, so
 * the bot can't drift from what the site currently shows. If nothing
 * matches, it hands off rather than guessing.
 */
export async function generateBotReply(userId: string, rawMessage: string): Promise<BotReply> {
  const text = normalize(rawMessage);

  if (matchesAny(text, DEPOSIT_KEYWORDS)) {
    const settings = await getPaymentSettings();
    if (!isPaymentSettingsConfigured(settings)) {
      return { body: "Hiện tại trang nạp tiền đang được cập nhật. Mình sẽ chuyển bạn tới Admin để hỗ trợ trực tiếp nhé.", handedOff: true };
    }
    return {
      body:
        `Bạn có thể nạp tiền theo 2 cách tại trang "Nạp tiền":\n` +
        `• QR Banking: chuyển khoản tới ${settings.bankName} — STK ${settings.accountNumber} (${settings.accountName})` +
        `${settings.transferContent ? `, nội dung: ${settings.transferContent}` : ""}, sau đó bấm "Tôi đã chuyển" và đợi Admin duyệt.\n` +
        `• Thẻ cào: nhập mã thẻ, đợi Admin duyệt.\n` +
        `Tiền sẽ được cộng vào ví ngay sau khi được duyệt.`,
      handedOff: false
    };
  }

  if (matchesAny(text, BALANCE_KEYWORDS)) {
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    const balance = Number(wallet?.balance ?? 0);
    return {
      body: `Số dư ví hiện tại của bạn là ${balance.toLocaleString("vi-VN")}đ${wallet?.frozen ? " (ví đang bị tạm khóa, liên hệ Admin để mở khóa)." : "."}`,
      handedOff: false
    };
  }

  if (matchesAny(text, PRODUCT_KEYWORDS)) {
    const products: ChatProduct[] = await prisma.product.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { isFeatured: "desc" },
      take: 5,
      select: { name: true, price: true, discountPrice: true }
    });
    if (products.length === 0) {
      return { body: "Hiện tại chưa có sản phẩm nào được đăng bán. Mình sẽ chuyển bạn tới Admin để biết thêm chi tiết.", handedOff: true };
    }
    const lines = products.map((product: ChatProduct) => {
      const price = Number(product.discountPrice ?? product.price);
      return `• ${product.name} — ${price.toLocaleString("vi-VN")}đ`;
    });
    return { body: `Một số sản phẩm nổi bật hiện có:\n${lines.join("\n")}\nBạn có thể xem toàn bộ tại trang Sản phẩm.`, handedOff: false };
  }

  if (matchesAny(text, ORDER_KEYWORDS)) {
    const count = await prisma.order.count({ where: { userId } });
    return {
      body:
        count === 0
          ? "Bạn chưa có đơn hàng nào. Ghé trang Sản phẩm để bắt đầu mua sắm nhé!"
          : `Bạn hiện có ${count} đơn hàng. Xem chi tiết tại trang "Đơn hàng" trong tài khoản.`,
      handedOff: false
    };
  }

  return { body: "Mình chưa có đủ dữ liệu để trả lời câu này. Mình sẽ chuyển cuộc trò chuyện tới Admin nhé.", handedOff: true };
}
