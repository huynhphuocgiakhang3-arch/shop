# KhangHuynh Vault — Mobile & Commerce Upgrade

- Mobile-first header with compact navigation and responsive typography.
- Premium FAQ/card sizing on small screens and safe-area floating controls.
- Real VI/EN UI switching bridge for common navigation and commerce labels.
- Dark/light visual system retained.
- Vault now contains a product showcase instead of redirect-only behavior.
- Product cards show editable sales count and live review rating aggregates.
- Super Admin can edit review rating/comment and remove reviews.
- Admin product form can edit the existing Product.salesCount field.
- Public routes added: /danh-muc, /thanh-vien, /lien-he, /quen-mat-khau, /trung-tam-tro-giup.
- Login/register default destination is /vault.
- Zalo Admin: 0775893691.
- Chatbot has a generated 10k+ keyword-variant index while using a small token-based runtime fallback to avoid scanning the entire generated index per message.
- Category/product modal mobile sizing improved to avoid oversized overlay presentation.

No Prisma schema migration is required for these changes; Product.salesCount and Review fields already exist in the current schema.
