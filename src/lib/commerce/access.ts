import type { MembershipTier } from "@prisma/client";

const TIER_RANK: Record<MembershipTier, number> = {
  FREE: 0,
  SILVER: 1,
  GOLD: 2,
  DIAMOND: 3
};

const VIP_TIERS = new Set<MembershipTier>(["SILVER", "GOLD", "DIAMOND"]);

export function tierRank(tier: MembershipTier): number {
  return TIER_RANK[tier];
}

export function isVipMember(tier: MembershipTier | string | null | undefined): boolean {
  return Boolean(tier && VIP_TIERS.has(tier as MembershipTier));
}

export function vipGateMessage(isVipOnly: boolean, tier: MembershipTier | string | null | undefined): string | null {
  if (!isVipOnly) return null;
  if (isVipMember(tier)) return null;
  return "Sản phẩm dành cho thành viên VIP (Bạc trở lên). Nâng hạng trong trang Thành viên hoặc liên hệ hỗ trợ.";
}

export function stockGateMessage(stock: number | null | undefined, quantity: number): string | null {
  if (stock == null) return null;
  if (stock <= 0) return "Sản phẩm này tạm hết suất.";
  if (quantity > stock) return `Chỉ còn ${stock} suất cho sản phẩm này.`;
  return null;
}
