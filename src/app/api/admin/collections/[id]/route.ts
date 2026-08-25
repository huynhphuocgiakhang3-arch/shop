import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guard";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";
import { requestMeta, writeAuditLog } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  description: z.string().max(500).optional().nullable(),
  coverUrl: z.string().url().optional().or(z.literal("")),
  isFeatured: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  productIds: z.array(z.string()).max(40).optional()
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, response } = await requireSuperAdmin();
    if (response) return response;

    const parsed = updateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ.", 422);

    const existing = await prisma.collection.findUnique({ where: { id: params.id } });
    if (!existing) return jsonError("Không tìm thấy bộ sưu tập.", 404);

    const collection = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (parsed.data.productIds) {
        await tx.collectionProduct.deleteMany({ where: { collectionId: params.id } });
        await tx.collectionProduct.createMany({
          data: parsed.data.productIds.map((productId, index) => ({ collectionId: params.id, productId, sortOrder: index }))
        });
      }
      return tx.collection.update({
        where: { id: params.id },
        data: {
          name: parsed.data.name,
          slug: parsed.data.slug,
          description: parsed.data.description,
          coverUrl: parsed.data.coverUrl === "" ? null : parsed.data.coverUrl,
          isFeatured: parsed.data.isFeatured,
          sortOrder: parsed.data.sortOrder
        }
      });
    });

    await writeAuditLog({
      userId: user.sub,
      action: "SUPER_ADMIN_UPDATE_COLLECTION",
      metadata: { collectionId: params.id, oldSlug: existing.slug, newSlug: collection.slug },
      ...requestMeta(req)
    });

    return jsonOk({ collection });
  } catch (error) {
    return handleApiError(error, "admin/collections/[id]:PATCH");
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, response } = await requireSuperAdmin();
    if (response) return response;

    await prisma.collection.delete({ where: { id: params.id } });
    await writeAuditLog({
      userId: user.sub,
      action: "SUPER_ADMIN_DELETE_COLLECTION",
      metadata: { collectionId: params.id },
      ...requestMeta(req)
    });
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error, "admin/collections/[id]:DELETE");
  }
}
