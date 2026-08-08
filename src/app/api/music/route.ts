import { prisma } from "@/lib/prisma";
import { jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tracks = await prisma.musicTrack.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, title: true, artist: true, source: true, url: true, coverUrl: true }
    });
    return jsonOk({ tracks });
  } catch (error) {
    return handleApiError(error, "music:GET");
  }
}
