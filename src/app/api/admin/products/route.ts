import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth/guard";
import { productSchema } from "@/lib/validations/product";
import { jsonError, jsonOk, parsePagination, paginatedResponse, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { response } = await requireAdmin();
    if (response) return response;

    const { page, pageSize, skip, take } = parsePagination(req.nextUrl.searchParams);
    const status = req.nextUrl.searchParams.get("status");

    const where = status ? { status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED" } : {};

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: { category: { select: { name: true } } }
      }),
      prisma.product.count({ where })
    ]);

    return jsonOk(paginatedResponse(items, total, page, pageSize));
  } catch (error) {
    return handleApiError(error, "admin/products:GET");
  }
}

export async function POST(req: NextRequest) {
  try {
    const { response } = await requireSuperAdmin();
    if (response) return response;

    const body = await req.json().catch(() => null);
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Thông tin sản phẩm không hợp lệ.", 422);
    }

    const existingSlug = await prisma.product.findUnique({ where: { slug: parsed.data.slug } });
    if (existingSlug) return jsonError("Slug sản phẩm đã tồn tại.", 409);

    const product = await prisma.product.create({
      data: {
        ...parsed.data,
        previewVideoUrl: parsed.data.previewVideoUrl || null,
        fileUrl: parsed.data.fileUrl || null
      }
    });

    return jsonOk({ product }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "admin/products:POST");
  }
}
