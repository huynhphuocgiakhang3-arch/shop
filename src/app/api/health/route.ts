import { prisma } from "@/lib/prisma";
import { jsonOk } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Health = "operational" | "down";

export async function GET() {
  let database: Health = "down";
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "operational";
  } catch {
    database = "down";
  }

  const derived: Health = database === "operational" ? "operational" : "down";

  return jsonOk({
    checkedAt: new Date().toISOString(),
    website: "operational" as const,
    database,
    payments: derived,
    downloads: derived,
    vault: derived,
    support: derived
  });
}
