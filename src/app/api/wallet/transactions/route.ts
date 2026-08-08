import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guard";
import { jsonError, jsonOk, parsePagination, paginatedResponse, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { user, response } = await requireUser();
    if (response) return response;

    const wallet = await prisma.wallet.findUnique({ where: { userId: user.sub } });
    if (!wallet) return jsonError("Không tìm thấy ví.", 404);

    const { page, pageSize, skip, take } = parsePagination(req.nextUrl.searchParams);

    const [items, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: "desc" },
        skip,
        take
      }),
      prisma.walletTransaction.count({ where: { walletId: wallet.id } })
    ]);

    return jsonOk(paginatedResponse(items, total, page, pageSize));
  } catch (error) {
    return handleApiError(error, "wallet/transactions:GET");
  }
}
