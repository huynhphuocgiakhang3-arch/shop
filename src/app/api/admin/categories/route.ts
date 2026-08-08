import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth/guard";
import { categorySchema } from "@/lib/validations/product";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { response } = await requireAdmin();
    if (response) return response;

    const categories = await prisma.category.findMany({
      orderBy: { order: "asc" },
      include: { _count: { select: { products: true } } }
    });
    return jsonOk({ categories });
  } catch (error) {
    return handleApiError(error, "admin/categories:GET");
  }
}

export async function POST(req: NextRequest) {
  try {
    const { response } = await requireSuperAdmin();
    if (response) return response;

    const body = await req.json().catch(() => null);
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Thông tin danh mục không hợp lệ.", 422);
    }

    const existingSlug = await prisma.category.findUnique({ where: { slug: parsed.data.slug } });
    if (existingSlug) return jsonError("Slug danh mục đã tồn tại.", 409);

    const category = await prisma.category.create({
      data: { ...parsed.data, bannerUrl: parsed.data.bannerUrl || null }
    });

    return jsonOk({ category }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "admin/categories:POST");
  }
}
