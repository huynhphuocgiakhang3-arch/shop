import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  try {
    const record = await prisma.downloadToken.findUnique({
      where: { token: params.token },
      include: { product: true }
    });

    if (!record) return jsonError("Liên kết tải xuống không hợp lệ.", 404);
    if (record.expiresAt && record.expiresAt < new Date()) {
      return jsonError("Liên kết tải xuống đã hết hạn.", 410);
    }
    if (!record.product.fileUrl) {
      return jsonError("Sản phẩm này chưa có tệp để tải xuống.", 404);
    }

    await prisma.downloadToken.update({ where: { id: record.id }, data: { downloadCount: { increment: 1 } } });
    await prisma.product.update({ where: { id: record.productId }, data: { downloadCount: { increment: 1 } } });

    return NextResponse.redirect(record.product.fileUrl);
  } catch (error) {
    return handleApiError(error, "downloads/[token]:GET");
  }
}
