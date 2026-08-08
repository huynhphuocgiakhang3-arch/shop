import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { generateSecureToken } from "@/lib/tokens";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { user: actingUser, response } = await requireAdmin();
    if (response) return response;

    const body = await req.json().catch(() => null);
    const userId = body?.userId as string | undefined;
    const productId = body?.productId as string | undefined;

    if (!userId || !productId) return jsonError("Thiếu người dùng hoặc sản phẩm.", 400);

    const [user, product] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.product.findUnique({ where: { id: productId } })
    ]);
    if (!user) return jsonError("Không tìm thấy người dùng.", 404);
    if (!product) return jsonError("Không tìm thấy sản phẩm.", 404);

    // A manually-granted token isn't tied to a real purchase, so it needs its
    // own order/orderItem row (zero-value, MANUAL payment method) purely to
    // satisfy the schema's requirement that every download trace back to an
    // order item — this keeps the download history model consistent instead
    // of special-casing "no order" everywhere else that reads DownloadToken.
    const order = await prisma.order.create({
      data: {
        orderNumber: `GRANT-${Date.now()}`,
        userId,
        subtotal: 0,
        total: 0,
        paymentMethod: "MANUAL",
        status: "PAID",
        paidAt: new Date(),
        items: { create: { productId, unitPrice: 0, quantity: 1 } }
      },
      include: { items: true }
    });

    const orderItem = order.items[0];
    if (!orderItem) {
      return jsonError("Không thể tạo mục đơn hàng cho token tải xuống.", 500);
    }

    const token = await prisma.downloadToken.create({
      data: {
        token: generateSecureToken(),
        userId,
        productId,
        orderItemId: orderItem.id
      }
    });

    await prisma.notification.create({
      data: {
        userId,
        type: "ORDER",
        title: "Bạn đã được cấp quyền tải xuống",
        body: `Quản trị viên đã cấp cho bạn quyền tải xuống sản phẩm "${product.name}".`
      }
    });

    await prisma.auditLog.create({
      data: { userId: actingUser.sub, action: "ADMIN_GRANT_DOWNLOAD", metadata: { targetUserId: userId, productId } }
    });

    return jsonOk({ downloadToken: token }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "admin/downloads/generate:POST");
  }
}
