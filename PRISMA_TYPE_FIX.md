# Prisma type compatibility fix

Fixed the remaining TypeScript errors caused by relying on Prisma `*GetPayload` helper types that are not exposed by the generated client in this project.

Changes:
- `src/app/page.tsx`: derives the product-card type from the actual `findMany` query return type.
- `src/app/vault/page.tsx`: derives the vault-product type from the actual query return type.
- `src/app/danh-muc/page.tsx`: uses a small explicit category-with-count type.
- Removed the unavailable `Prisma.ProductGetPayload` / `Prisma.CategoryGetPayload` references.
- Existing runtime/database logic is unchanged.
