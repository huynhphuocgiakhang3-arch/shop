# KhangHuynh Vault — product highlight sync fix

## Fixed
- Public homepage product cards now receive `featureBullets` from Prisma instead of falling back to the default green-check list.
- Product create/update/archive APIs now invalidate `/` and `/san-pham` so catalog changes are reflected immediately.
- Admin product save calls `router.refresh()` after a successful create/update so the next return to the shop receives the fresh server payload.

## Result
Changing the green-check feature text in Super Admin > Sản phẩm is now reflected on the homepage on the first render, not only after opening Marketplace/product detail.
