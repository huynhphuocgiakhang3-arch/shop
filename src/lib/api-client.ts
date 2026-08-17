// ---------------------------------------------------------------------------
// API client with automatic token refresh
//
// When the server responds 401 the client transparently calls /api/auth/refresh
// to rotate the access token (server sets new httpOnly cookie), then retries
// the original request once. If the refresh also fails the user is redirected
// to the login page.
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

let isRefreshing = false;
// Queue of { resolve, reject } callbacks waiting for the refresh to complete.
let refreshSubscribers: Array<(ok: boolean) => void> = [];

function onRefreshComplete(ok: boolean) {
  refreshSubscribers.forEach((cb) => cb(ok));
  refreshSubscribers = [];
}

async function tryRefresh(): Promise<boolean> {
  if (isRefreshing) {
    // Another request already kicked off a refresh — wait for it.
    return new Promise((resolve) => {
      refreshSubscribers.push(resolve);
    });
  }

  isRefreshing = true;
  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include"
    });
    const ok = res.ok;
    onRefreshComplete(ok);
    return ok;
  } catch {
    onRefreshComplete(false);
    return false;
  } finally {
    isRefreshing = false;
  }
}

type RequestOpts = {
  isRetry?: boolean;
  // Guest-safe requests (e.g. "who am I") must NEVER force a redirect —
  // a 401 here just means "not logged in", which is a completely normal,
  // expected state for a visitor browsing the site. Only genuinely
  // protected actions (checkout, downloads, profile, admin, etc.) should
  // kick the user to the login page when their session is gone.
  silent?: boolean;
};

async function request<T>(path: string, init?: RequestInit, opts: RequestOpts = {}): Promise<T> {
  const { isRetry = false, silent = false } = opts;

  const res = await fetch(path, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers }
  });

  if (res.status === 401 && !isRetry) {
    // Access token expired/missing — attempt a silent refresh, then retry once.
    const refreshed = await tryRefresh();
    if (refreshed) {
      return request<T>(path, init, { isRetry: true, silent });
    }

    if (silent) {
      // Expected "guest" state — no cookie, no session. Let the caller
      // (e.g. useCurrentUser) treat this as "no user" instead of a hard error.
      throw new ApiError("Chưa đăng nhập.", 401);
    }

    // Refresh failed on a genuinely protected request (e.g. refresh token
    // expired/revoked while inside checkout/dashboard/admin) — kick the user out.
    if (typeof window !== "undefined") {
      const current = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/dang-nhap?redirectTo=${current}`;
    }
    throw new ApiError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", 401);
  }

  const body = await res.json().catch(() => ({})) as { message?: string };

  if (!res.ok) {
    throw new ApiError(body?.message ?? "Đã xảy ra lỗi. Vui lòng thử lại.", res.status);
  }

  return body as T;
}

export const api = {
  get: <T>(path: string, opts?: { silent?: boolean }) => request<T>(path, undefined, opts),
  post: <T>(path: string, data?: unknown, opts?: { silent?: boolean }) =>
    request<T>(path, { method: "POST", body: data ? JSON.stringify(data) : undefined }, opts),
  patch: <T>(path: string, data?: unknown, opts?: { silent?: boolean }) =>
    request<T>(path, { method: "PATCH", body: data ? JSON.stringify(data) : undefined }, opts),
  put: <T>(path: string, data?: unknown, opts?: { silent?: boolean }) =>
    request<T>(path, { method: "PUT", body: data ? JSON.stringify(data) : undefined }, opts),
  delete: <T>(path: string, data?: unknown, opts?: { silent?: boolean }) =>
    request<T>(path, { method: "DELETE", body: data ? JSON.stringify(data) : undefined }, opts)
};
