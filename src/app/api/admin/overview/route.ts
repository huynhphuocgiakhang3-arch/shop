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
    const fourteenDaysAgo = new Date(startOfToday.getTime() - 13 * 24 * 60 * 60 * 1000);

    const [
      revenueTotal,
      revenueToday,
      revenueMonth,
      orderCounts,
      userCount,
      newUsersLast30d,
      topProducts,
      pendingTickets,
      pendingWalletTx,
      dailyRows
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
      prisma.walletTransaction.count({ where: { status: "PENDING" } }),
      // Raw SQL for a day-bucketed revenue + order-count series — Prisma's
      // groupBy can't bucket by calendar day, and running 14 separate
      // aggregate() calls would be 14 round trips for what is one query.
      prisma.$queryRaw<{ day: Date; revenue: string; orders: bigint }[]>`
        SELECT date_trunc('day', "paidAt") AS day,
               COALESCE(SUM("total"), 0) AS revenue,
               COUNT(*) AS orders
        FROM "Order"
        WHERE "status" = 'PAID' AND "paidAt" >= ${fourteenDaysAgo}
        GROUP BY day
        ORDER BY day ASC
      `
    ]);

    // Fill in any days with zero orders so the chart has a continuous
    // 14-point x-axis instead of gaps.
    const revenueByDay = new Map<string, { revenue: number; orders: number }>();
    for (const row of dailyRows) {
      const key = row.day.toISOString().slice(0, 10);
      revenueByDay.set(key, { revenue: Number(row.revenue), orders: Number(row.orders) });
    }
    const dailySeries: { date: string; revenue: number; orders: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(startOfToday.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      const bucket = revenueByDay.get(key);
      dailySeries.push({ date: key, revenue: bucket?.revenue ?? 0, orders: bucket?.orders ?? 0 });
    }

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
      pendingWalletTransactions: pendingWalletTx,
      dailySeries
    });
  } catch (error) {
    return handleApiError(error, "admin/overview:GET");
  }
}
