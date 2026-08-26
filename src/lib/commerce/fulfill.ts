import type { Prisma } from "@prisma/client";
import { generateSecureToken } from "@/lib/tokens";
import { generateLicenseKey } from "@/lib/commerce/license";

interface FulfillItem {
  id: string;
  productId: string;
  quantity: number;
  licenseKey?: string | null;
}

export async function fulfillPaidOrderItems(
  tx: Prisma.TransactionClient,
  input: { userId: string; items: FulfillItem[] }
) {
  for (const item of input.items) {
    const existingToken = await tx.downloadToken.findFirst({ where: { orderItemId: item.id } });
    if (!existingToken) {
      await tx.downloadToken.create({
        data: {
          token: generateSecureToken(),
          userId: input.userId,
          productId: item.productId,
          orderItemId: item.id
        }
      });
    }

    if (!item.licenseKey) {
      await tx.orderItem.update({
        where: { id: item.id },
        data: { licenseKey: generateLicenseKey() }
      });
    }

    const product = await tx.product.findUnique({
      where: { id: item.productId },
      select: { stock: true }
    });
    await tx.product.update({
      where: { id: item.productId },
      data: {
        salesCount: { increment: item.quantity },
        ...(product?.stock != null ? { stock: { decrement: item.quantity } } : {})
      }
    });
  }
}
