import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth/guard";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";
import { requestMeta, writeAuditLog } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const collectionSchema = z.object({
  name: z.string().min(2),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().max(500).optional().nullable(),
  coverUrl: z.string().url().optional().or(z.literal("")),
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  productIds: z.array(z.string()).max(40).default([])
});

export async function GET() {
  try {
    const { response } = await requireAdmin();
    if (response) return response;

    const collections = await prisma.collection.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: { _count: { select: { products: true } }, products: { select: { productId: true } } }
    });
    return jsonOk({ collections });
  } catch (error) {
    return handleApiError(error, "admin/collections:GET");
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, response } = await requireSuperAdmin();
    if (response) return response;

    const parsed = collectionSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ.", 422);

    const collection = await prisma.collection.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description ?? null,
        coverUrl: parsed.data.coverUrl || null,
        isFeatured: parsed.data.isFeatured,
        sortOrder: parsed.data.sortOrder,
        products: {
          create: parsed.data.productIds.map((productId, index) => ({ productId, sortOrder: index }))
        }
      }
    });

    await writeAuditLog({
      userId: user.sub,
      action: "SUPER_ADMIN_CREATE_COLLECTION",
      metadata: { collectionId: collection.id, slug: collection.slug },
      ...requestMeta(req)
    });

    return jsonOk({ collection }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "admin/collections:POST");
  }
}
