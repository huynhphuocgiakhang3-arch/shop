"use client";

import { useEffect } from "react";

const DICT: Record<string, string> = {
  "Đăng nhập":"Sign in", "Đăng ký":"Sign up", "Đăng xuất":"Sign out", "Tạo tài khoản":"Create account",
  "Sản phẩm":"Products", "Danh mục":"Categories", "Đơn hàng":"Orders", "Người dùng":"Users", "Tin nhắn":"Messages",
  "Nạp tiền":"Deposit", "Thanh toán":"Payments", "Nhạc nền":"Background music", "Giao diện & Hệ thống":"Appearance & System",
  "Tổng quan":"Overview", "Giỏ hàng":"Cart", "Thông báo":"Notifications", "Hồ sơ":"Profile", "Tải xuống":"Downloads",
  "Yêu thích":"Favorites", "Trung tâm hỗ trợ":"Help Center", "Liên hệ":"Contact",
  "Marketplace":"Marketplace", "Thành viên VIP":"VIP Membership", "Quên mật khẩu":"Forgot password", "Số dư":"Balance",
  "Mua ngay":"Buy now", "Thêm vào giỏ hàng":"Add to cart", "Xem chi tiết":"View details", "Giá hiện tại":"Current price",
  "Tất cả":"All", "Mới nhất":"Newest", "Bán chạy nhất":"Best sellers", "Giá thấp đến cao":"Price: low to high", "Giá cao đến thấp":"Price: high to low",
  "Khách hàng nói gì":"What customers say", "Câu hỏi thường gặp":"Frequently asked questions", "Đang bán":"Published", "Bản nháp":"Draft", "Đã lưu trữ":"Archived",
  "Tạo sản phẩm":"Create product", "Quản lý sản phẩm":"Product management", "Quản lý danh mục":"Category management", "Tạo danh mục":"Create category",
  "Mã giảm giá":"Coupons", "Tạo mã":"Create coupon", "Đánh giá":"Reviews", "Chưa có đánh giá nào cho sản phẩm này.":"No reviews yet.",
  "Giao hàng số tức thì":"Instant digital delivery", "Kiểm duyệt & bảo mật":"Curated & secure", "Hỗ trợ khách hàng 24/7":"24/7 customer support",
  "File hỗ trợ":"Support file", "NỔI BẬT":"FEATURED", "ƯU ĐÃI":"DEAL", "Đã bán":"sold", "Instant":"Instant",
  "Chào bạn":"Hello", "Admin":"Admin", "Music":"Music", "Chat trực tiếp với Admin":"Chat with Admin"
};

function normalize(s: string) { return s.replace(/\s+/g, " ").trim(); }

function translateDom(to: "vi"|"en") {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) nodes.push(n as Text);
  for (const node of nodes) {
    const parent = node.parentElement;
    if (!parent || ["SCRIPT","STYLE","NOSCRIPT","TEXTAREA","INPUT"].includes(parent.tagName)) continue;
    const original = normalize(node.nodeValue || "");
    if (!original) continue;
    if (to === "en") {
      const value = DICT[original];
      if (value) {
        node.nodeValue = value;
        parent.dataset.khvTranslated = original;
      }
    } else if (parent.dataset.khvTranslated) {
      node.nodeValue = parent.dataset.khvTranslated;
      delete parent.dataset.khvTranslated;
    }
  }
}

export function LanguageBridge() {
  useEffect(() => {
    const apply = (lang: "vi"|"en") => {
      document.documentElement.lang = lang;
      document.documentElement.dataset.language = lang;
      translateDom(lang);
    };
    const saved = localStorage.getItem("khv-language") === "en" ? "en" : "vi";
    apply(saved);
    const onChange = (event: Event) => apply((event as CustomEvent<"vi"|"en">).detail);
    window.addEventListener("khv-language-change", onChange);
    const observer = new MutationObserver(() => {
      if (document.documentElement.lang === "en") translateDom("en");
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => { window.removeEventListener("khv-language-change", onChange); observer.disconnect(); };
  }, []);
  return null;
}
