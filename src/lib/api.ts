import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

/**
 * Same diagnostic logging as `handleApiError`, without deciding the
 * HTTP response — for routes that need to branch on specific error
 * conditions themselves (e.g. a custom sentinel error) before falling
 * back to a generic response.
 */
export function logApiError(context: string, error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    console.error(`[${context}] PrismaClientKnownRequestError:`, {
      code: error.code,
      meta: error.meta,
      message: error.message,
      stack: error.stack
    });
    return;
  }
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  console.error(`[${context}] Unexpected error:`, { message, stack });
}

/**
 * Central error handler for every Route Handler. Without this, an
 * uncaught error thrown inside a route (most commonly a
 * PrismaClientKnownRequestError — unique constraint violation, missing
 * row, FK violation, or a schema/DB drift error like "column does not
 * exist") escapes the handler entirely. Next.js then returns its own
 * generic 500 with no guaranteed JSON body, which breaks every client
 * call site that does `res.json()` on the response — turning one DB
 * hiccup into a second, unrelated client-side crash.
 *
 * Call this from a `catch` block in every route: `return
 * handleApiError(error, "context/label")`. It logs full diagnostic
 * detail server-side (Prisma's `code`/`meta`/`message` plus the stack)
 * and always returns a well-formed JSON error response with an
 * appropriate status code, never leaking internals to the client.
 */
export function handleApiError(error: unknown, context: string) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    console.error(`[${context}] PrismaClientKnownRequestError:`, {
      code: error.code,
      meta: error.meta,
      message: error.message,
      stack: error.stack
    });

    switch (error.code) {
      case "P2002": // unique constraint violation
        return jsonError("Dữ liệu đã tồn tại (vi phạm ràng buộc duy nhất).", 409);
      case "P2025": // record required for operation not found
        return jsonError("Không tìm thấy dữ liệu yêu cầu.", 404);
      case "P2003": // foreign key constraint violation
        return jsonError("Dữ liệu liên quan không hợp lệ.", 400);
      case "P2021": // table does not exist
      case "P2022": // column does not exist
        // Schema/DB drift — the DB has not been migrated to match
        // schema.prisma. This is a deployment problem, not a user error.
        console.error(
          `[${context}] Database schema is out of sync with schema.prisma. ` +
            `Run \`prisma migrate deploy\` against this database.`
        );
        return jsonError("Máy chủ đang được cấu hình. Vui lòng thử lại sau.", 503);
      default:
        return jsonError("Đã xảy ra lỗi khi xử lý yêu cầu.", 500);
    }
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    console.error(`[${context}] PrismaClientInitializationError:`, {
      message: error.message,
      stack: error.stack
    });
    return jsonError("Máy chủ đang được cấu hình. Vui lòng thử lại sau.", 503);
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    console.error(`[${context}] PrismaClientValidationError:`, {
      message: error.message,
      stack: error.stack
    });
    return jsonError("Yêu cầu không hợp lệ.", 400);
  }

  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  console.error(`[${context}] Unexpected error:`, { message, stack });
  return jsonError("Đã xảy ra lỗi. Vui lòng thử lại.", 500);
}

export function jsonOk<T>(data: T, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}

/** Parses `?page=&pageSize=` with sane bounds, used across every list endpoint. */
export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? 12) || 12));
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

export function paginatedResponse<T>(items: T[], total: number, page: number, pageSize: number) {
  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    }
  };
}
