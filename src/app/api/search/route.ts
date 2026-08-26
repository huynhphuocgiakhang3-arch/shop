import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q")?.trim();
    const type = req.nextUrl.searchParams.get("type"); // "users" | "orders" — admin only
    if (!q || q.length < 2) return jsonOk({ products: [], categories: [] });

    if (type === "users" || type === "orders") {
      const user = await getSessionUser();
      const isAdmin = user && (user.role === "ADMIN" || user.role === "SUPER_ADMIN");
      if (!isAdmin) return jsonOk({ results: [] });

      if (type === "users") {
        const users = await prisma.user.findMany({
          where: { OR: [{ email: { contains: q, mode: "insensitive" } }, { displayName: { contains: q, mode: "insensitive" } }] },
          take: 10,
          select: { id: true, email: true, displayName: true, role: true, membershipTier: true }
        });
        return jsonOk({ results: users });
      }

      const orders = await prisma.order.findMany({
        where: { orderNumber: { contains: q, mode: "insensitive" } },
        take: 10,
        include: { user: { select: { displayName: true, email: true } } }
      });
      return jsonOk({ results: orders });
    }

    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: {
          status: "PUBLISHED",
          OR: [{ name: { contains: q, mode: "insensitive" } }, { tags: { has: q } }]
        },
        take: 8,
        select: { id: true, name: true, slug: true, thumbnailUrl: true, price: true, discountPrice: true }
      }),
      prisma.category.findMany({
        where: { name: { contains: q, mode: "insensitive" } },
        take: 5,
        select: { id: true, name: true, slug: true }
      })
    ]);

    if (products.length === 0) {
      const prefix = q.slice(0, 3);
      const suggestions = await prisma.product.findMany({
        where: {
          status: "PUBLISHED",
          OR: [
            { name: { contains: prefix, mode: "insensitive" } },
            { tags: { hasSome: q.split(/\s+/).filter(Boolean) } }
          ]
        },
        take: 5,
        select: { id: true, name: true, slug: true, thumbnailUrl: true, price: true, discountPrice: true }
      });
      return jsonOk({ products: [], categories, suggestions });
    }

    return jsonOk({ products, categories });
  } catch (error) {
    return handleApiError(error, "search:GET");
  }
}
