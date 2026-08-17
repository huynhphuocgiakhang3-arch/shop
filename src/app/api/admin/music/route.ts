import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth/guard";
import { musicTrackSchema } from "@/lib/validations/commerce";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeYoutubeUrl(url: string) {
  const idFromUrl = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/)?.[1];
  return idFromUrl ?? url;
}

export async function GET() {
  try {
    const { response } = await requireAdmin();
    if (response) return response;

    const tracks = await prisma.musicTrack.findMany({ orderBy: { sortOrder: "asc" } });
    return jsonOk({ tracks });
  } catch (error) {
    return handleApiError(error, "admin/music:GET");
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, response } = await requireSuperAdmin();
    if (response) return response;

    const body = await req.json().catch(() => null);
    const parsed = musicTrackSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ.", 422);

    const maxOrder = await prisma.musicTrack.aggregate({ _max: { sortOrder: true } });

    const track = await prisma.musicTrack.create({
      data: {
        ...parsed.data,
        url: parsed.data.source === "YOUTUBE" ? normalizeYoutubeUrl(parsed.data.url) : parsed.data.url,
        addedById: user.sub,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1
      }
    });

    return jsonOk({ track }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "admin/music:POST");
  }
}
