/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "**.vercel.app" }
    ]
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb"
    },
    // Prisma ships native query-engine binaries and bcryptjs relies on
    // plain CommonJS/Node APIs — both must run as real Node modules, not
    // be traced/bundled into the Next.js server bundle. Without this,
    // Vercel deployments intermittently fail to locate the Prisma engine
    // at runtime even when the build itself succeeds.
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs"]
  }
};

module.exports = nextConfig;
