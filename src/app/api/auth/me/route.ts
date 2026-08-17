import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guard";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { user, response } = await requireUser();
    if (response) return response;

    const dbUser = await prisma.user.findUnique({
      where: { id: user.sub },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        membershipTier: true,
        rewardPoints: true,
        emailVerifiedAt: true,
        createdAt: true
      }
    });

    if (!dbUser) return jsonError("Không tìm thấy tài khoản.", 404);
    return jsonOk({ user: dbUser });
  } catch (error) {
    return handleApiError(error, "auth/me:GET");
  }
}
