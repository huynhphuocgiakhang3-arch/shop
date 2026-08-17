import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guard";
import { jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface FavoriteWithProduct {
  product: { status: string };
}

export async function GET() {
  try {
    const { user, response } = await requireUser();
    if (response) return response;

    const favorites = await prisma.favorite.findMany({
      where: { userId: user.sub },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          select: { id: true, name: true, slug: true, thumbnailUrl: true, price: true, discountPrice: true, status: true }
        }
      }
    });

    return jsonOk({
      favorites: (favorites as FavoriteWithProduct[]).filter((f: FavoriteWithProduct) => f.product.status === "PUBLISHED")
    });
  } catch (error) {
    return handleApiError(error, "favorites:GET");
  }
}
