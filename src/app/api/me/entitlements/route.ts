import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guard";
import { jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { user, response } = await requireUser();
    if (response) return response;

    const items = await prisma.orderItem.findMany({
      where: { order: { userId: user.sub, status: "PAID" } },
      select: { productId: true },
      distinct: ["productId"]
    });

    return jsonOk({ productIds: items.map((item: { productId: string }) => item.productId) });
  } catch (error) {
    return handleApiError(error, "me/entitlements:GET");
  }
}
