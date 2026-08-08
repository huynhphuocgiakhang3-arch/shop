import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) return jsonError("Vui lòng đăng nhập để tiếp tục.", 401);

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: { include: { product: { select: { name: true, thumbnailUrl: true, slug: true } } } },
        coupon: { select: { code: true } },
        user: { select: { displayName: true, email: true } }
      }
    });

    if (!order) return jsonError("Không tìm thấy đơn hàng.", 404);
    if (order.userId !== user.sub && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return jsonError("Bạn không có quyền xem đơn hàng này.", 403);
    }

    return jsonOk({ order });
  } catch (error) {
    return handleApiError(error, "orders/[id]:GET");
  }
}
