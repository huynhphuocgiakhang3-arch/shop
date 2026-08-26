import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { response } = await requireAdmin();
    if (response) return response;

    const [totalReferrers, totalReferred, commissionAgg, topReferrersRaw] = await Promise.all([
      prisma.user.count({ where: { referrals: { some: {} } } }),
      prisma.user.count({ where: { referredById: { not: null } } }),
      prisma.walletTransaction.aggregate({ where: { type: "COMMISSION", status: "COMPLETED" }, _sum: { amount: true }, _count: true }),
      prisma.user.findMany({
        where: { referrals: { some: {} } },
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
          email: true,
          _count: { select: { referrals: true } }
        },
        orderBy: { referrals: { _count: "desc" } },
        take: 20
      })
    ]);

    // Commission earned per top referrer — one grouped query instead of N.
    const referrerIds = topReferrersRaw.map((r: (typeof topReferrersRaw)[number]) => r.id);
    const wallets = referrerIds.length
      ? await prisma.wallet.findMany({ where: { userId: { in: referrerIds } }, select: { id: true, userId: true } })
      : [];
    const walletIdToUserId = new Map<string, string>(wallets.map((w: (typeof wallets)[number]) => [w.id, w.userId]));
    const commissionByWallet = wallets.length
      ? await prisma.walletTransaction.groupBy({
          by: ["walletId"],
          where: { walletId: { in: wallets.map((w: (typeof wallets)[number]) => w.id) }, type: "COMMISSION", status: "COMPLETED" },
          _sum: { amount: true }
        })
      : [];
    const commissionByUser = new Map<string, number>();
    for (const row of commissionByWallet as { walletId: string; _sum: { amount: unknown } }[]) {
      const userId = walletIdToUserId.get(row.walletId);
      if (userId) commissionByUser.set(userId, Number(row._sum.amount ?? 0));
    }

    return jsonOk({
      overview: {
        totalReferrers,
        totalReferred,
        totalCommissionPaid: Number(commissionAgg._sum.amount ?? 0),
        totalPayouts: commissionAgg._count
      },
      topReferrers: topReferrersRaw.map((r: (typeof topReferrersRaw)[number]) => ({
        id: r.id,
        displayName: r.displayName,
        avatarUrl: r.avatarUrl,
        email: r.email,
        referredCount: r._count.referrals,
        commissionEarned: commissionByUser.get(r.id) ?? 0
      }))
    });
  } catch (error) {
    return handleApiError(error, "admin/referrals:GET");
  }
}
