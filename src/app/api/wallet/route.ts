import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guard";
import { jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { user, response } = await requireUser();
    if (response) return response;

    const wallet = await prisma.wallet.upsert({
      where: { userId: user.sub },
      update: {},
      create: { userId: user.sub }
    });

    return jsonOk({ wallet });
  } catch (error) {
    return handleApiError(error, "wallet:GET");
  }
}
