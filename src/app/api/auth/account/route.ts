import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guard";
import { deleteAccountSchema } from "@/lib/validations/user";
import { jsonError, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest) {
  try {
    const { user, response } = await requireUser();
    if (response) return response;

    const body = await req.json().catch(() => null);
    const parsed = deleteAccountSchema.safeParse(body);
    if (!parsed.success) return jsonError("Vui lòng nhập mật khẩu để xác nhận.", 422);

    const dbUser = await prisma.user.findUnique({ where: { id: user.sub } });
    if (!dbUser) return jsonError("Không tìm thấy tài khoản.", 404);

    const valid = await bcrypt.compare(parsed.data.password, dbUser.passwordHash);
    if (!valid) return jsonError("Mật khẩu không đúng.", 401);

    // Soft delete: preserves order/financial history for accounting and
    // dispute purposes, but the account can no longer authenticate and its
    // email is freed up for re-registration.
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.sub },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          email: `deleted+${user.sub}@khanghuynh.vault`
        }
      }),
      prisma.refreshToken.updateMany({
        where: { userId: user.sub, revokedAt: null },
        data: { revokedAt: new Date() }
      })
    ]);

    const res = NextResponse.json({ message: "Tài khoản đã được xóa." });
    res.cookies.set("access_token", "", { path: "/", maxAge: 0 });
    res.cookies.set("refresh_token", "", { path: "/", maxAge: 0 });
    return res;
  } catch (error) {
    return handleApiError(error, "auth/account:DELETE");
  }
}
