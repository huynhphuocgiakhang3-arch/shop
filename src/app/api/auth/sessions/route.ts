import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guard";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SessionRow {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  token: string;
}

export async function GET() {
  try {
    const { user, response } = await requireUser();
    if (response) return response;

    const currentRefreshToken = cookies().get("refresh_token")?.value;

    const sessions: SessionRow[] = await prisma.refreshToken.findMany({
      where: { userId: user.sub },
      orderBy: { createdAt: "desc" },
      select: { id: true, ipAddress: true, userAgent: true, createdAt: true, expiresAt: true, revokedAt: true, token: true }
    });

    return jsonOk({
      sessions: sessions.map((s: SessionRow) => {
        const { token, ...rest } = s;
        return { ...rest, isCurrent: token === currentRefreshToken };
      })
    });
  } catch (error) {
    return handleApiError(error, "auth/sessions:GET");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { user, response } = await requireUser();
    if (response) return response;

    const id = req.nextUrl.searchParams.get("id");
    if (!id) return jsonError("Thiếu mã phiên đăng nhập.", 400);

    const session = await prisma.refreshToken.findUnique({ where: { id } });
    if (!session || session.userId !== user.sub) {
      return jsonError("Không tìm thấy phiên đăng nhập.", 404);
    }

    await prisma.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } });
    return jsonOk({ message: "Đã đăng xuất khỏi thiết bị này." });
  } catch (error) {
    return handleApiError(error, "auth/sessions:DELETE");
  }
}
