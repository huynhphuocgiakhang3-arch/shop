# KhangHuynh Vault — Production checklist

1. Keep `.env` local and configure the same variables in Vercel Project Settings > Environment Variables.
2. Set `NEXT_PUBLIC_SITE_URL` to the real production URL.
3. Run `npx prisma generate` during build (already included in `npm run build`).
4. Run `npx prisma migrate deploy` against the production database before the first release that contains new migrations.
5. Run `npm run build` locally before deploying.
6. Never commit `.env` to Git. The release archive may contain `.env` only because it was explicitly requested for local setup.
7. Because credentials were shared during this conversation, rotate the database, JWT, and Cloudinary secrets after setup if this archive will be shared with anyone else.
