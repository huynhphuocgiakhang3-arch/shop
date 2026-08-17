import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { response } = await requireAdmin();
    if (response) return response;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      revenueTotal,
      revenueToday,
      revenueMonth,
      orderCounts,
      userCount,
      newUsersLast30d,
      topProducts,
      pendingTickets,
      pendingWalletTx
    ] = await Promise.all([
      prisma.order.aggregate({ where: { status: "PAID" }, _sum: { total: true } }),
      prisma.order.aggregate({ where: { status: "PAID", paidAt: { gte: startOfToday } }, _sum: { total: true } }),
      prisma.order.aggregate({ where: { status: "PAID", paidAt: { gte: startOfMonth } }, _sum: { total: true } }),
      prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.user.count({ where: { isDeleted: false } }),
      prisma.user.count({ where: { isDeleted: false, createdAt: { gte: thirtyDaysAgo } } }),
      prisma.product.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { salesCount: "desc" },
        take: 5,
        select: { id: true, name: true, slug: true, salesCount: true, downloadCount: true, thumbnailUrl: true }
      }),
      prisma.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
      prisma.walletTransaction.count({ where: { status: "PENDING" } })
    ]);

    const orders: Record<string, number> = {};
    for (const row of orderCounts) {
      orders[row.status as string] = row._count._all;
    }

    return jsonOk({
      revenue: {
        total: revenueTotal._sum.total ?? 0,
        today: revenueToday._sum.total ?? 0,
        thisMonth: revenueMonth._sum.total ?? 0
      },
      orders,
      users: { total: userCount, newLast30Days: newUsersLast30d },
      topProducts,
      pendingTickets,
      pendingWalletTransactions: pendingWalletTx
    });
  } catch (error) {
    return handleApiError(error, "admin/overview:GET");
  }
}
