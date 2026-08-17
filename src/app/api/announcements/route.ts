import { prisma } from "@/lib/prisma";
import { jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const announcements = await prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 10
    });
    return jsonOk({ announcements });
  } catch (error) {
    return handleApiError(error, "announcements:GET");
  }
}
