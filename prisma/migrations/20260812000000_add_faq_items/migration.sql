CREATE TABLE "FaqItem" (
  "id" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FaqItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FaqItem_isActive_sortOrder_idx" ON "FaqItem"("isActive", "sortOrder");

INSERT INTO "FaqItem" ("id", "question", "answer", "sortOrder", "isActive", "createdAt", "updatedAt") VALUES
('faq-default-1', 'Tôi nhận sản phẩm bằng cách nào sau khi mua?', 'Sau khi thanh toán thành công bằng số dư Wallet, sản phẩm sẽ xuất hiện ngay trong Vault/Tải xuống của tài khoản bạn.', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('faq-default-2', 'KhangHuynh Vault hỗ trợ phương thức thanh toán nào?', 'Khi mua sản phẩm, hệ thống sử dụng số dư Wallet đã nạp trước đó. Bạn có thể nạp tiền tại trang Nạp tiền.', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('faq-default-3', 'Tôi có thể hoàn tiền nếu không hài lòng không?', 'Bạn có thể gửi yêu cầu qua Trung tâm hỗ trợ để được kiểm tra theo chính sách của từng sản phẩm và trạng thái đơn hàng.', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('faq-default-4', 'Thành viên VIP có những quyền lợi gì?', 'Silver/Gold/Diamond có thể nhận ưu đãi riêng, ưu tiên hỗ trợ và quyền truy cập các sản phẩm VIP khi được cấu hình.', 4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('faq-default-5', 'Quên mật khẩu thì làm sao?', 'Dùng chức năng Quên mật khẩu tại trang đăng nhập. Hệ thống sẽ hướng dẫn khôi phục qua email.', 5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('faq-default-6', 'Tôi cần gặp Admin?', 'Bạn có thể mở Chat trực tiếp với Admin hoặc liên hệ Zalo Admin: 0775893691.', 6, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
