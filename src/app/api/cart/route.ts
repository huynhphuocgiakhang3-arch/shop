import { requireUser } from "@/lib/auth/guard";
import { getOrCreateCart, computeCartSummary } from "@/lib/commerce/cart";
import { jsonOk } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { user, response } = await requireUser();
  if (response) return response;

  const cart = await getOrCreateCart(user.sub);
  return jsonOk({ cart, summary: computeCartSummary(cart) });
}
