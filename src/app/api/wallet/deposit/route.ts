import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth/guard";
import { walletDepositSchema } from "@/lib/validations/commerce";
import { jsonError, jsonOk, handleApiError, parsePagination, paginatedResponse } from "@/lib/api";
import { isSameOrigin } from "@/lib/security/same-origin";
import { rateLimit, clientIp } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// No live payment gateway is wired up (see README) — QR bank transfer and
// card deposits are both real user-facing flows, but every one of them lands
// as a PENDING DepositRequest that a SUPER_ADMIN must approve before the
// wallet is ever touched. Approval (POST /api/admin/deposits/[id]/approve)
// is the only code path that creates a WalletTransaction for a deposit.
export async function POST(req: NextRequest) {
  try {
    if (!isSameOrigin(req)) return jsonError("Yêu cầu không hợp lệ.", 403);

    const { user, response } = await requireActiveUser();
    if (response) return response;

    // 5 deposit requests per minute per user+IP — generous for a real user,
    // tight enough to blunt automated PENDING-request spam (PHẦN 11).
    const limit = rateLimit(`wallet-deposit:${user.sub}:${clientIp(req)}`, 5, 60_000);
    if (!limit.allowed) return jsonError("Bạn gửi yêu cầu nạp tiền quá nhanh. Vui lòng thử lại sau.", 429);

    const body = await req.json().catch(() => null);
    const parsed = walletDepositSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ.", 422);

    const wallet = await prisma.wallet.upsert({
      where: { userId: user.sub },
      update: {},
      create: { userId: user.sub }
    });
    if (wallet.frozen) return jsonError("Ví của bạn đang bị tạm khóa. Vui lòng liên hệ Admin.", 423);

    // Duplicate-submit guard: the exact same proof screenshot (QR) or card
    // code can never be attached to more than one deposit request — blocks
    // the "resubmit the same transfer proof for a second credit" replay.
    if (parsed.data.proofImageUrl) {
      const dup = await prisma.depositRequest.findFirst({ where: { proofImageUrl: parsed.data.proofImageUrl } });
      if (dup) return jsonError("Ảnh chuyển khoản này đã được sử dụng cho một yêu cầu khác.", 409);
    }
    if (parsed.data.cardCode || parsed.data.cardSerial) {
      const dup = await prisma.depositRequest.findFirst({
        where: {
          method: "CARD",
          ...(parsed.data.cardProvider ? { cardProvider: parsed.data.cardProvider } : {}),
          ...(parsed.data.cardSerial ? { cardSerial: parsed.data.cardSerial } : {}),
          ...(parsed.data.cardCode ? { cardCode: parsed.data.cardCode } : {})
        }
      });
      if (dup) return jsonError("Thông tin thẻ này đã được sử dụng cho một yêu cầu khác.", 409);
    }

    const deposit = await prisma.depositRequest.create({
      data: {
        userId: user.sub,
        method: parsed.data.method,
        amount: parsed.data.amount,
        proofImageUrl: parsed.data.proofImageUrl,
        cardProvider: parsed.data.cardProvider,
        cardSerial: parsed.data.cardSerial,
        cardCode: parsed.data.cardCode,
        note: parsed.data.note,
        ipAddress: clientIp(req),
        userAgent: req.headers.get("user-agent") ?? undefined
      }
    });

    await prisma.notification.create({
      data: {
        userId: user.sub,
        type: "WALLET",
        title: "Yêu cầu nạp tiền đã được ghi nhận",
        body: `Yêu cầu nạp ${Number(deposit.amount).toLocaleString("vi-VN")}đ đang chờ Admin duyệt.`
      }
    });

    return jsonOk(
      { deposit, message: "Yêu cầu nạp tiền đã được ghi nhận, đang chờ xác nhận." },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, "wallet/deposit:POST");
  }
}

// A user's own deposit history — dashboard "Nạp tiền" page polls this to
// show PENDING/APPROVED/REJECTED status without an admin needing to message them.
export async function GET(req: NextRequest) {
  try {
    const { user, response } = await requireActiveUser();
    if (response) return response;

    const { searchParams } = new URL(req.url);
    const { page, pageSize, skip, take } = parsePagination(searchParams);

    const [items, total] = await Promise.all([
      prisma.depositRequest.findMany({
        where: { userId: user.sub },
        orderBy: { createdAt: "desc" },
        skip,
        take
      }),
      prisma.depositRequest.count({ where: { userId: user.sub } })
    ]);

    return jsonOk(paginatedResponse(items, total, page, pageSize));
  } catch (error) {
    return handleApiError(error, "wallet/deposit:GET");
  }
}
