import type { OrderStatus, WalletTxType, WalletTxStatus, TicketStatus, MembershipTier } from "@prisma/client";

export function formatVnd(value: number | string) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value));
}

export function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

export function formatDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

// Keyed by the actual Prisma enums (not `string`) so every lookup is a
// finite mapped-object access, not an index-signature access — TypeScript
// proves these are always defined, and adding a new enum value anywhere
// in schema.prisma without updating these maps fails the build instead of
// silently rendering "undefined" in the UI.
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Đang chờ xử lý",
  PAID: "Đã thanh toán",
  FAILED: "Thất bại",
  REFUNDED: "Đã hoàn tiền",
  CANCELLED: "Đã hủy"
};

export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING: "text-state-warning bg-state-warning/10",
  PAID: "text-state-success bg-state-success/10",
  FAILED: "text-state-danger bg-state-danger/10",
  REFUNDED: "text-accent-blue bg-accent-blue/10",
  CANCELLED: "text-white/40 bg-white/5"
};

export const WALLET_TX_LABEL: Record<WalletTxType, string> = {
  DEPOSIT: "Nạp tiền",
  WITHDRAW: "Rút tiền",
  PURCHASE: "Thanh toán",
  REFUND: "Hoàn tiền",
  BONUS: "Thưởng",
  COMMISSION: "Hoa hồng",
  ADJUSTMENT: "Điều chỉnh"
};

export const WALLET_TX_STATUS_LABEL: Record<WalletTxStatus, string> = {
  PENDING: "Đang chờ",
  COMPLETED: "Hoàn tất",
  REJECTED: "Bị từ chối"
};

export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = {
  OPEN: "Đang mở",
  IN_PROGRESS: "Đang xử lý",
  RESOLVED: "Đã giải quyết",
  CLOSED: "Đã đóng"
};

export const MEMBERSHIP_LABEL: Record<MembershipTier, string> = {
  FREE: "Miễn phí",
  SILVER: "Bạc",
  GOLD: "Vàng",
  DIAMOND: "Kim cương"
};

/** Returns true for transaction types that credit (add to) the wallet balance. */
export function isCredit(type: WalletTxType): boolean {
  return type === "DEPOSIT" || type === "REFUND" || type === "BONUS" || type === "ADJUSTMENT";
}
