import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guard";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";
import { z } from "zod";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const faqUpdateSchema = z.object({ question: z.string().trim().min(3).max(300).optional(), answer: z.string().trim().min(3).max(5000).optional(), sortOrder: z.number().int().min(0).max(99999).optional(), isActive: z.boolean().optional() });
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) { try { const { response } = await requireSuperAdmin(); if (response) return response; const parsed = faqUpdateSchema.safeParse(await req.json().catch(() => null)); if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "FAQ không hợp lệ.", 422); const existing = await prisma.faqItem.findUnique({ where: { id: params.id } }); if (!existing) return jsonError("Không tìm thấy FAQ.", 404); const item = await prisma.faqItem.update({ where: { id: params.id }, data: parsed.data }); revalidatePath("/"); revalidatePath("/trung-tam-tro-giup"); return jsonOk({ item }); } catch (error) { return handleApiError(error, "admin/faqs/[id]:PATCH"); } }
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) { try { const { response } = await requireSuperAdmin(); if (response) return response; await prisma.faqItem.delete({ where: { id: params.id } }); revalidatePath("/"); revalidatePath("/trung-tam-tro-giup"); return jsonOk({ deleted: true }); } catch (error) { return handleApiError(error, "admin/faqs/[id]:DELETE"); } }
