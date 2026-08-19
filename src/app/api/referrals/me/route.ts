import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guard";
import { ensureReferralCode } from "@/lib/referral";
import { getSiteSettings } from "@/lib/settings";
import { jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { user, response } = await requireUser();
    if (response) return response;

    const [referralCode, settings, referredUsers, commissionAgg] = await Promise.all([
      ensureReferralCode(user.sub),
      getSiteSettings(),
      prisma.user.findMany({
        where: { referredById: user.sub },
        select: { id: true, displayName: true, avatarUrl: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 100
      }),
      prisma.walletTransaction.aggregate({
        where: { type: "COMMISSION", status: "COMPLETED", wallet: { userId: user.sub } },
        _sum: { amount: true },
        _count: true
      })
    ]);

    const referredIds = referredUsers.map((r: (typeof referredUsers)[number]) => r.id);
    const paidOrders = referredIds.length
      ? await prisma.order.findMany({
          where: { userId: { in: referredIds }, status: "PAID" },
          select: { userId: true },
          distinct: ["userId"]
        })
      : [];
    const convertedIds = new Set(paidOrders.map((o: (typeof paidOrders)[number]) => o.userId));

    return jsonOk({
      referralCode,
      commissionPercent: Number(settings.referralCommissionPercent),
      enabled: settings.referralEnabled,
      stats: {
        totalReferred: referredUsers.length,
        totalConverted: convertedIds.size,
        totalCommission: Number(commissionAgg._sum.amount ?? 0),
        commissionPayouts: commissionAgg._count
      },
      referredUsers: referredUsers.map((r: (typeof referredUsers)[number]) => ({
        id: r.id,
        displayName: r.displayName,
        avatarUrl: r.avatarUrl,
        createdAt: r.createdAt,
        hasPurchased: convertedIds.has(r.id)
      }))
    });
  } catch (error) {
    return handleApiError(error, "referrals/me:GET");
  }
}
