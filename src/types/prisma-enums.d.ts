// ---------------------------------------------------------------------------
// Prisma type declarations for pre-generate environments
//
// The `.prisma/client` stub (present when `prisma generate` has not yet run)
// does not export named enum types. We re-declare them here so TypeScript
// compiles in all environments. On Vercel the real generated types take
// precedence via module augmentation merge.
//
// PrismaClient and the Prisma namespace are declared as `any` aliases so
// that "no exported member" errors don't surface before generate runs,
// while still allowing the Proxy in lib/prisma.ts to accept any property.
// ---------------------------------------------------------------------------
type _AnyType = any; // single alias used below to avoid lint on each line

declare module "@prisma/client" {
  // Ensure PrismaClient is importable before `prisma generate` has run
  export type PrismaClient = _AnyType;
  export declare const PrismaClient: new (...args: _AnyType[]) => _AnyType;

  export namespace Prisma {
    export type TransactionClient = _AnyType;
    export type PrismaPromise<T = _AnyType> = Promise<T>;
    export type ProductOrderByWithRelationInput = _AnyType;
    export type ProductWhereInput = _AnyType;
    export type CartGetPayload<_T = _AnyType> = _AnyType;

    // Runtime error classes used by src/lib/api.ts's error handler.
    // Declared as classes (not `= _AnyType` aliases) so `instanceof`
    // narrowing and property access (`.code`, `.meta`, `.message`)
    // type-check correctly even before `prisma generate` has run.
    export class PrismaClientKnownRequestError extends Error {
      code: string;
      meta?: Record<string, _AnyType>;
      clientVersion: string;
    }
    export class PrismaClientInitializationError extends Error {
      clientVersion: string;
    }
    export class PrismaClientValidationError extends Error {
      clientVersion: string;
    }
  }

  // ------------------------------------------------------------------
  // Enums — must mirror schema.prisma exactly
  // ------------------------------------------------------------------

  export type Role = "USER" | "ADMIN" | "SUPER_ADMIN";
  export const Role: { USER: "USER"; ADMIN: "ADMIN"; SUPER_ADMIN: "SUPER_ADMIN" };

  export type MembershipTier = "FREE" | "SILVER" | "GOLD" | "DIAMOND";
  export const MembershipTier: { FREE: "FREE"; SILVER: "SILVER"; GOLD: "GOLD"; DIAMOND: "DIAMOND" };

  export type ProductStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
  export const ProductStatus: { DRAFT: "DRAFT"; PUBLISHED: "PUBLISHED"; ARCHIVED: "ARCHIVED" };

  export type OrderStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "CANCELLED";
  export const OrderStatus: {
    PENDING: "PENDING"; PAID: "PAID"; FAILED: "FAILED"; REFUNDED: "REFUNDED"; CANCELLED: "CANCELLED";
  };

  export type PaymentMethod =
    | "WALLET" | "BANK_TRANSFER" | "STRIPE" | "PAYPAL" | "VNPAY" | "MOMO" | "MANUAL";
  export const PaymentMethod: {
    WALLET: "WALLET"; BANK_TRANSFER: "BANK_TRANSFER"; STRIPE: "STRIPE"; PAYPAL: "PAYPAL";
    VNPAY: "VNPAY"; MOMO: "MOMO"; MANUAL: "MANUAL";
  };

  export type WalletTxType =
    | "DEPOSIT" | "WITHDRAW" | "PURCHASE" | "REFUND"
    | "BONUS" | "COMMISSION" | "ADJUSTMENT";
  export const WalletTxType: {
    DEPOSIT: "DEPOSIT"; WITHDRAW: "WITHDRAW"; PURCHASE: "PURCHASE"; REFUND: "REFUND";
    BONUS: "BONUS"; COMMISSION: "COMMISSION"; ADJUSTMENT: "ADJUSTMENT";
  };

  export type WalletTxStatus = "PENDING" | "COMPLETED" | "REJECTED";
  export const WalletTxStatus: { PENDING: "PENDING"; COMPLETED: "COMPLETED"; REJECTED: "REJECTED" };

  export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  export const TicketStatus: { OPEN: "OPEN"; IN_PROGRESS: "IN_PROGRESS"; RESOLVED: "RESOLVED"; CLOSED: "CLOSED" };

  export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  export const TicketPriority: { LOW: "LOW"; MEDIUM: "MEDIUM"; HIGH: "HIGH"; URGENT: "URGENT" };

  export type NotificationType = "ORDER" | "WALLET" | "MEMBERSHIP" | "SECURITY" | "SUPPORT" | "SYSTEM";
  export const NotificationType: {
    ORDER: "ORDER"; WALLET: "WALLET"; MEMBERSHIP: "MEMBERSHIP";
    SECURITY: "SECURITY"; SUPPORT: "SUPPORT"; SYSTEM: "SYSTEM";
  };
}
