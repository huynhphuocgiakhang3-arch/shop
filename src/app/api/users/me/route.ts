import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guard";
import { updateProfileSchema } from "@/lib/validations/user";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  try {
    const { user, response } = await requireUser();
    if (response) return response;

    const body = await req.json().catch(() => null);
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Thông tin không hợp lệ.", 422);
    }

    const updated = await prisma.user.update({
      where: { id: user.sub },
      data: parsed.data,
      select: { id: true, displayName: true, avatarUrl: true }
    });

    return jsonOk({ user: updated });
  } catch (error) {
    return handleApiError(error, "users/me:PATCH");
  }
}
