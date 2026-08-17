import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPasswordHash = await bcrypt.hash("Admin@12345", 12);
  const userPasswordHash = await bcrypt.hash("User@12345", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@khanghuynh.vault" },
    update: {},
    create: {
      email: "admin@khanghuynh.vault",
      displayName: "Quản trị viên",
      passwordHash: adminPasswordHash,
      role: "SUPER_ADMIN",
      emailVerifiedAt: new Date(),
      wallet: { create: { balance: 0 } },
      cart: { create: {} }
    }
  });

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@khanghuynh.vault" },
    update: {},
    create: {
      email: "demo@khanghuynh.vault",
      displayName: "Khách demo",
      passwordHash: userPasswordHash,
      role: "USER",
      membershipTier: "SILVER",
      emailVerifiedAt: new Date(),
      wallet: { create: { balance: 500000 } },
      cart: { create: {} }
    }
  });

  const software = await prisma.category.upsert({
    where: { slug: "phan-mem" },
    update: {},
    create: { name: "Phần mềm", slug: "phan-mem", icon: "monitor", order: 1 }
  });

  const accounts = await prisma.category.upsert({
    where: { slug: "tai-khoan" },
    update: {},
    create: { name: "Tài khoản", slug: "tai-khoan", icon: "user-check", order: 2 }
  });

  const design = await prisma.category.upsert({
    where: { slug: "thiet-ke" },
    update: {},
    create: { name: "Tài nguyên thiết kế", slug: "thiet-ke", icon: "palette", order: 3 }
  });

  const products = [
    {
      name: "Bộ công cụ tự động hóa VaultFlow Pro",
      slug: "vaultflow-pro",
      shortDescription: "Bộ script tự động hóa quy trình làm việc cho developer.",
      description: "VaultFlow Pro là bộ công cụ CLI giúp tự động hóa các tác vụ lặp lại trong quy trình phát triển phần mềm, từ deploy đến kiểm thử.",
      thumbnailUrl: "https://res.cloudinary.com/demo/image/upload/v1/samples/ecommerce/leather-bag-gray.jpg",
      price: 490000,
      discountPrice: 390000,
      isFeatured: true,
      tags: ["automation", "cli", "developer"],
      categoryId: software.id
    },
    {
      name: "Gói tài khoản Premium Cloud Storage 1 năm",
      slug: "premium-cloud-storage-1-year",
      shortDescription: "Tài khoản lưu trữ đám mây 2TB, bảo hành 12 tháng.",
      description: "Tài khoản Premium Cloud Storage dung lượng 2TB, đồng bộ đa thiết bị, bảo hành thay thế trong 12 tháng.",
      thumbnailUrl: "https://res.cloudinary.com/demo/image/upload/v1/samples/ecommerce/accessories-bag.jpg",
      price: 890000,
      isVipOnly: false,
      tags: ["cloud", "storage", "account"],
      categoryId: accounts.id
    },
    {
      name: "Bộ 200 Mockup UI Premium",
      slug: "premium-ui-mockup-pack",
      shortDescription: "200 mockup giao diện chất lượng cao cho Figma/Sketch.",
      description: "Bộ sưu tập 200 mockup UI premium, tương thích Figma và Sketch, cập nhật xu hướng thiết kế mới nhất.",
      thumbnailUrl: "https://res.cloudinary.com/demo/image/upload/v1/samples/ecommerce/analog-classic.jpg",
      price: 350000,
      discountPrice: 250000,
      isFeatured: true,
      tags: ["design", "ui", "mockup"],
      categoryId: design.id
    },
    {
      name: "VaultGuard — Bộ bảo mật ứng dụng web",
      slug: "vaultguard-web-security-kit",
      shortDescription: "Middleware và cấu hình bảo mật sẵn dùng cho Next.js.",
      description: "VaultGuard cung cấp middleware CSRF, rate-limit và audit-log sẵn dùng, giúp rút ngắn thời gian triển khai bảo mật cho dự án Next.js.",
      thumbnailUrl: "https://res.cloudinary.com/demo/image/upload/v1/samples/ecommerce/shoes.png",
      price: 590000,
      isFeatured: false,
      tags: ["security", "nextjs", "middleware"],
      categoryId: software.id
    }
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: { ...product, galleryUrls: [], tags: product.tags, status: "PUBLISHED" }
    });
  }

  await prisma.announcement.upsert({
    where: { id: "seed-announcement-launch" },
    update: {},
    create: {
      id: "seed-announcement-launch",
      title: "Chào mừng đến với KhangHuynh Vault",
      body: "Nền tảng thương mại số cao cấp chính thức ra mắt. Khám phá ngay các sản phẩm nổi bật!",
      isActive: true
    }
  });

  console.info("Seed hoàn tất:");
  console.info(`  Admin:  ${admin.email} / Admin@12345`);
  console.info(`  User:   ${demoUser.email} / User@12345`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
