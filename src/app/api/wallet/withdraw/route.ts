import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guard";
import { walletWithdrawSchema } from "@/lib/validations/commerce";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { user, response } = await requireUser();
    if (response) return response;

    const body = await req.json().catch(() => null);
    const parsed = walletWithdrawSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Số tiền không hợp lệ.", 422);

    const wallet = await prisma.wallet.findUnique({ where: { userId: user.sub } });
    if (!wallet || Number(wallet.balance) < parsed.data.amount) {
      return jsonError("Số dư không đủ để thực hiện yêu cầu rút tiền.", 402);
    }
    if (wallet.frozen) return jsonError("Ví của bạn đang bị tạm khóa. Vui lòng liên hệ Admin.", 423);

    const [, tx] = await prisma.$transaction([
      prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: parsed.data.amount }, pendingBalance: { increment: parsed.data.amount } }
      }),
      prisma.walletTransaction.create({
        data: { walletId: wallet.id, type: "WITHDRAW", status: "PENDING", amount: parsed.data.amount, note: parsed.data.note }
      })
    ]);

    return jsonOk({ transaction: tx, message: "Yêu cầu rút tiền đã được ghi nhận, đang chờ xử lý." }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "wallet/withdraw:POST");
  }
}
