# KhangHuynh Vault — UI/UX Mobile + 3D Upgrade

## Đã nâng cấp
- Hero headline chuyển từ kiểu đổi chữ đột ngột sang typing → hold → erase → typing, dùng chung PC/mobile.
- 3D Vault Core phản hồi chuột nhanh hơn, orbit nhanh hơn và giảm kích thước vùng 3D trên mobile để tránh cảm giác chậm.
- Vault có nút **Xem trưng bày** quay trực tiếp về storefront homepage.
- Mobile user dashboard có hamburger drawer hoàn chỉnh, nút Shop và menu cuộn an toàn.
- Admin mobile drawer được giữ nguyên nhưng nội dung hệ thống được giới hạn chiều rộng, tránh lòi ngang.
- Mobile search được làm full-width, vùng bấm tối thiểu 44–50px, phù hợp iOS.
- Safe-area iOS, overflow ngang và typography mobile được tinh chỉnh.
- Trang đơn hàng đổi nhãn PAID thành **Đã hoàn tất**; thao tác hoàn tiền được gắn rõ là chỉnh sửa đơn hoàn tất.

## Lưu ý
- Không thay đổi schema Prisma trong patch này.
- Không thay đổi logic wallet/checkout/download.
- Không thêm fake social proof.
- prefers-reduced-motion vẫn được tôn trọng.
