import { prisma } from "@/lib/prisma";
import { jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      orderBy: { order: "asc" },
      include: {
        children: {
          orderBy: { order: "asc" },
          include: { _count: { select: { products: true } } }
        },
        _count: { select: { products: true } }
      }
    });

    return jsonOk({ categories });
  } catch (error) {
    return handleApiError(error, "categories:GET");
  }
}
