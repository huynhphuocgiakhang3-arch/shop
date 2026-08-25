import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth/guard";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  productId: z.string().min(1),
  pinned: z.boolean().optional(),
  notes: z.string().max(4000).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(32)).max(12).optional()
});

async function assertOwned(userId: string, productId: string) {
  return prisma.orderItem.findFirst({
    where: { productId, order: { userId, status: "PAID" } },
    select: { id: true }
  });
}

export async function GET() {
  try {
    const { user, response } = await requireActiveUser();
    if (response) return response;

    const items = await prisma.vaultItem.findMany({
      where: { userId: user.sub },
      select: { productId: true, pinned: true, pinnedAt: true, notes: true, tags: true, updatedAt: true }
    });
    return jsonOk({ items });
  } catch (error) {
    return handleApiError(error, "vault/items:GET");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user, response } = await requireActiveUser();
    if (response) return response;

    const parsed = patchSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ.", 422);

    const owned = await assertOwned(user.sub, parsed.data.productId);
    if (!owned) return jsonError("Bạn chưa sở hữu sản phẩm này.", 403);

    const data: {
      pinned?: boolean;
      pinnedAt?: Date | null;
      notes?: string | null;
      tags?: string[];
    } = {};

    if (parsed.data.pinned !== undefined) {
      data.pinned = parsed.data.pinned;
      data.pinnedAt = parsed.data.pinned ? new Date() : null;
    }
    if (parsed.data.notes !== undefined) data.notes = parsed.data.notes;
    if (parsed.data.tags !== undefined) {
      data.tags = Array.from(new Set(parsed.data.tags.map((tag) => tag.replace(/^#/, "").toLowerCase())));
    }

    const item = await prisma.vaultItem.upsert({
      where: { userId_productId: { userId: user.sub, productId: parsed.data.productId } },
      create: {
        userId: user.sub,
        productId: parsed.data.productId,
        pinned: data.pinned ?? false,
        pinnedAt: data.pinnedAt ?? null,
        notes: data.notes ?? null,
        tags: data.tags ?? []
      },
      update: data
    });

    return jsonOk({ item });
  } catch (error) {
    return handleApiError(error, "vault/items:PATCH");
  }
}
