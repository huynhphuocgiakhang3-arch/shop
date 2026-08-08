import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guard";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { response } = await requireSuperAdmin();
    if (response) return response;

    const source = await prisma.product.findUnique({ where: { id: params.id } });
    if (!source) return jsonError("Không tìm thấy sản phẩm.", 404);

    let slug = `${source.slug}-copy`;
    let suffix = 1;
    while (await prisma.product.findUnique({ where: { slug } })) {
      suffix += 1;
      slug = `${source.slug}-copy-${suffix}`;
    }

    const duplicate = await prisma.product.create({
      data: {
        name: `${source.name} (Bản sao)`,
        slug,
        shortDescription: source.shortDescription,
        description: source.description,
        thumbnailUrl: source.thumbnailUrl,
        galleryUrls: source.galleryUrls,
        previewVideoUrl: source.previewVideoUrl,
        fileUrl: source.fileUrl,
        releaseNotes: source.releaseNotes,
        tags: source.tags,
        version: source.version,
        fileSizeMb: source.fileSizeMb,
        compatibility: source.compatibility,
        price: source.price,
        discountPrice: source.discountPrice,
        stock: source.stock,
        isVipOnly: source.isVipOnly,
        isFeatured: false,
        status: "DRAFT",
        categoryId: source.categoryId
      }
    });

    return jsonOk({ product: duplicate }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "admin/products/[id]/duplicate:POST");
  }
}
