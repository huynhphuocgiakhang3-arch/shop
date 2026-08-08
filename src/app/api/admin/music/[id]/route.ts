import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guard";
import { musicTrackSchema } from "@/lib/validations/commerce";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeYoutubeUrl(url: string) {
  const idFromUrl = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/)?.[1];
  return idFromUrl ?? url;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { response } = await requireSuperAdmin();
    if (response) return response;

    const existing = await prisma.musicTrack.findUnique({ where: { id: params.id } });
    if (!existing) return jsonError("Không tìm thấy bài hát.", 404);

    const body = await req.json().catch(() => null);

    // Partial update: only re-validate fields actually sent, but reuse the
    // full schema by merging onto the existing row so cross-field checks
    // (YouTube ID format vs URL format) still run against the final shape.
    const merged = {
      title: body?.title ?? existing.title,
      artist: body?.artist ?? existing.artist ?? undefined,
      source: body?.source ?? existing.source,
      url: body?.url ?? existing.url,
      coverUrl: body?.coverUrl ?? existing.coverUrl ?? undefined,
      isActive: typeof body?.isActive === "boolean" ? body.isActive : existing.isActive
    };
    const parsed = musicTrackSchema.safeParse(merged);
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ.", 422);

    const track = await prisma.musicTrack.update({
      where: { id: params.id },
      data: { ...parsed.data, url: parsed.data.source === "YOUTUBE" ? normalizeYoutubeUrl(parsed.data.url) : parsed.data.url }
    });

    return jsonOk({ track });
  } catch (error) {
    return handleApiError(error, "admin/music/[id]:PATCH");
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { response } = await requireSuperAdmin();
    if (response) return response;

    const existing = await prisma.musicTrack.findUnique({ where: { id: params.id } });
    if (!existing) return jsonError("Không tìm thấy bài hát.", 404);

    await prisma.musicTrack.delete({ where: { id: params.id } });
    return jsonOk({ success: true });
  } catch (error) {
    return handleApiError(error, "admin/music/[id]:DELETE");
  }
}
