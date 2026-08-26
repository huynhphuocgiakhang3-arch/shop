import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guard";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";
import { z } from "zod";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const faqSchema = z.object({ question: z.string().trim().min(3).max(300), answer: z.string().trim().min(3).max(5000), sortOrder: z.number().int().min(0).max(99999).default(0), isActive: z.boolean().default(true) });
export async function GET() { try { const { response } = await requireSuperAdmin(); if (response) return response; return jsonOk({ items: await prisma.faqItem.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }) }); } catch (error) { return handleApiError(error, "admin/faqs:GET"); } }
export async function POST(req: NextRequest) { try { const { response } = await requireSuperAdmin(); if (response) return response; const parsed = faqSchema.safeParse(await req.json().catch(() => null)); if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "FAQ không hợp lệ.", 422); const item = await prisma.faqItem.create({ data: parsed.data }); revalidatePath("/"); revalidatePath("/trung-tam-tro-giup"); return jsonOk({ item }, { status: 201 }); } catch (error) { return handleApiError(error, "admin/faqs:POST"); } }
