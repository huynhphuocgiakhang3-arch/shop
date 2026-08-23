// Vietnamese is the source-of-truth key (matches all existing copy in the
// codebase, so no component needs its Vietnamese text rewritten — only
// wrapped in `t()`). Missing keys fall back to the Vietnamese original
// rather than throwing, so a partially-translated page never shows a raw
// key or blank string to the visitor.
export const dictionary = {
  // Header / navigation
  "Marketplace": "Marketplace",
  "Danh mục": "Categories",
  "Thành viên VIP": "VIP Membership",
  "Tìm kiếm...": "Search...",
  "Đăng nhập": "Sign in",
  "Đăng ký": "Sign up",
  "Đăng xuất": "Sign out",
  "Tạo tài khoản": "Create account",
  "Mở Vault cá nhân": "Open My Vault",
  "Menu điều hướng": "Navigation menu",
  "Đóng menu": "Close menu",
  "Ngôn ngữ & Giao diện": "Language & Display",

  // Footer
  "Sản phẩm": "Products",
  "Hỗ trợ": "Support",
  "Tài khoản": "Account",
  "Trung tâm trợ giúp": "Help Center",
  "Câu hỏi thường gặp": "FAQ",
  "Liên hệ": "Contact",
  "Trợ giúp": "Help",
  "Quên mật khẩu": "Forgot password",
  "Nền tảng thương mại số cao cấp, nơi mỗi sản phẩm và mỗi thao tác đều được thiết kế để tạo cảm giác đáng tin cậy.":
    "A premium digital commerce platform, where every product and every interaction is designed to feel trustworthy.",
  "Trusted digital commerce": "Trusted digital commerce",
  "Đã đăng ký bản quyền.": "All rights reserved.",
  "Built with intention.": "Built with intention.",

  // Hero / marketplace chrome
  "Khám phá Marketplace": "Explore Marketplace",
  "Mở Vault": "Open Vault",
  "Chạm để xoay": "Tap to rotate",
  "PREMIUM DIGITAL MARKETPLACE": "PREMIUM DIGITAL MARKETPLACE",
  "LIVE": "LIVE",

  // Product card
  "Xem nhanh": "Quick view",
  "Mua ngay": "Buy now",
  "Thêm giỏ hàng": "Add to cart",
  "Thêm vào giỏ hàng": "Add to cart",
  "File hỗ trợ": "Support file",
  "NỔI BẬT": "FEATURED",
  "ƯU ĐÃI": "DEAL",
  "đã bán": "sold",
  "Instant": "Instant",
  "Chưa có đánh giá": "No reviews yet",
  "đánh giá": "reviews",
  "Giá hiện tại": "Current price",

  // Common actions used across many surfaces
  "Xem chi tiết": "View details",
  "Xem chi tiết đầy đủ": "View full details",
  "Tất cả": "All",
  "Mới nhất": "Newest",
  "Bán chạy nhất": "Best sellers",
  "Giá thấp đến cao": "Price: low to high",
  "Giá cao đến thấp": "Price: high to low",
  "Đóng": "Close",
  "Hủy": "Cancel",
  "Lưu": "Save",
  "Gửi": "Send"
} as const;

export type TranslationKey = keyof typeof dictionary;
export type Locale = "vi" | "en";
