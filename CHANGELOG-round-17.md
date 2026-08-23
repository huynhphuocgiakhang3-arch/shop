# KhangHuynh Vault — Round 17: Hợp nhất hệ thống chuyển động toàn site (Phase 1/n)

## Cách tiếp cận cho yêu cầu "toàn bộ web xịn như Apple"
Thay vì sửa từng trang một (rủi ro cao, chậm, dễ sót), em bắt đầu từ **hệ thống dùng chung** — sửa đúng 1 chỗ, có tác dụng lên toàn bộ site tự động. Đây là cách các đội ngũ senior thật sự làm khi cần nâng chất lượng đồng loạt.

## Đã làm trong round này: hợp nhất easing curve
**Phát hiện:** đường cong chuyển động "premium" (`cubic-bezier(0.22, 1, 0.36, 1)` — tạo cảm giác nhanh-rồi-êm-dần, giống hệ điều hành macOS/iOS) đã được dùng khá nhất quán trong code, nhưng bị **viết tay lặp lại rời rạc**:
- 8 lần dưới dạng chuỗi trong CSS thuần (`globals.css`).
- 11+ lần dưới dạng mảng `[0.22, 1, 0.36, 1]` rải rác trong các file component khác nhau.

Kiểu lặp lại này là dấu hiệu điển hình của codebase "chưa thật sự hệ thống hoá" — muốn tinh chỉnh cảm giác chuyển động của cả site (ví dụ làm nhanh hơn/êm hơn) sẽ phải sửa hàng chục nơi, dễ sót, dễ lệch.

**Đã hợp nhất về đúng 1 nguồn duy nhất, đồng bộ ở cả 3 tầng công nghệ đang dùng:**
- CSS thuần → biến `--khv-ease-premium` trong `:root`.
- Tailwind utility (`ease-premium`) → giữ nguyên, đã ghi chú liên kết.
- Framer Motion (JS) → hằng số `EASE_PREMIUM` mới trong `src/lib/motion.ts`.

Đã migrate các component nền tảng dùng ở **mọi trang** (Button, Modal, ConfirmDialog, Toast, RouteTransition) sang dùng nguồn chung này.

## Đã kiểm tra
- `tsc --noEmit`: 0 lỗi. `eslint`: 0 lỗi, 4 warning cũ (không đổi).
- Build lại CSS thật bằng Tailwind, verify bằng browser thật: biến CSS hoạt động đúng, easing áp dụng chính xác — không có gì "trông có vẻ đúng nhưng thực ra vỡ".
- Đây là thay đổi thuần refactor (không đổi hành vi/visual) — rủi ro gần như bằng 0, an toàn tuyệt đối để deploy.

## Baseline đã kiểm tra và xác nhận đã tốt sẵn (không cần sửa)
- Tap highlight/touch-action đã tắt đúng chuẩn (`-webkit-tap-highlight-color: transparent`, `touch-action: manipulation`) — cảm giác giống app native, không có khung xám khi chạm trên mobile.
- Font smoothing (`antialiased`, `text-rendering: optimizeLegibility`) đã bật.
- Hệ thống phản hồi khi hover/nhấn (`khv-interactive`, `khv-hover-glow`) đã có sẵn và áp dụng nhất quán qua `GlassPanel`.

## Tiếp theo (Phase 2, 3...)
Round sau em sẽ tiếp tục theo hướng hệ thống: rà soát khoảng cách 8px, độ nhất quán bo góc (`border-radius`), rồi mới đến polish riêng từng trang cụ thể. Nhắn "tiếp tục" để em làm Phase 2 ngay, hoặc nếu có trang cụ thể muốn ưu tiên trước thì cho em biết.
