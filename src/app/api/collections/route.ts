import { prisma } from "@/lib/prisma";
import { jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const collections = await prisma.collection.findMany({
      orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
      include: {
        products: {
          orderBy: { sortOrder: "asc" },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                shortDescription: true,
                thumbnailUrl: true,
                price: true,
                discountPrice: true,
                isFeatured: true,
                isVipOnly: true,
                isBestseller: true,
                salesCount: true,
                status: true,
                category: { select: { name: true, slug: true } }
              }
            }
          }
        },
        _count: { select: { products: true } }
      }
    });

    type CollectionRow = (typeof collections)[number];
    type CollectionProductRow = CollectionRow["products"][number];
    return jsonOk({
      collections: collections.map((collection: CollectionRow) => ({
        id: collection.id,
        name: collection.name,
        slug: collection.slug,
        description: collection.description,
        coverUrl: collection.coverUrl,
        isFeatured: collection.isFeatured,
        productCount: collection._count.products,
        products: collection.products
          .filter((row: CollectionProductRow) => row.product.status === "PUBLISHED")
          .map((row: CollectionProductRow) => ({
            ...row.product,
            price: Number(row.product.price),
            discountPrice: row.product.discountPrice == null ? null : Number(row.product.discountPrice)
          }))
      }))
    });
  } catch (error) {
    return handleApiError(error, "collections:GET");
  }
}
