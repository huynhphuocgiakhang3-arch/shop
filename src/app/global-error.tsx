"use client";

import { useEffect } from "react";

// Triggered only when the *root layout* itself throws (extremely rare —
// e.g. a provider crashing during render). Next.js requires this file to
// render its own <html>/<body>, since it fully replaces the root layout
// when active. Deliberately has zero dependency on SiteHeader, providers,
// data hooks, or the design-system components other error/not-found pages
// use — if the root layout is what crashed, those could be implicated too,
// and this is the one screen that must never itself fail to render.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[global-error]", { digest: error.digest, message: error.message });
  }, [error]);

  return (
    <html lang="vi">
      <body style={{ margin: 0, background: "#0a0a0a", color: "#fff", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", textAlign: "center" }}>
          <h1 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "12px" }}>Đã có lỗi nghiêm trọng xảy ra</h1>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", maxWidth: "420px", marginBottom: "24px" }}>
            Rất tiếc, ứng dụng không thể tải. Vui lòng thử lại hoặc tải lại trang.
          </p>
          {error.digest && <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.25)", marginBottom: "24px" }}>Mã lỗi: {error.digest}</p>}
          <button
            onClick={() => reset()}
            style={{ minHeight: "44px", padding: "0 24px", borderRadius: "999px", background: "#ff7a1a", color: "#000", fontWeight: 600, border: "none", cursor: "pointer" }}
          >
            Thử lại
          </button>
        </div>
      </body>
    </html>
  );
}
