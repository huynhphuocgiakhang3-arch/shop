"use client";

import Link from "next/link";
import { Wallet, Package, Heart, Bell, Download, ArrowRight } from "lucide-react";
import { recentlyViewedSlugs } from "@/lib/commerce/recently-viewed";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks/useProfile";
import { useWallet } from "@/hooks/useWallet";
import { useOrders } from "@/hooks/useOrders";
import { useNotifications } from "@/hooks/useNotifications";
import { useFavorites } from "@/hooks/useFavorites";
import { useDownloadHistory } from "@/hooks/useDownloads";
import { StatCard, SectionCard, EmptyState, LoadingBlock } from "@/components/dashboard/primitives";
import { formatVnd, formatDate, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR, MEMBERSHIP_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";

function greeting(name?: string) {
  const h = new Date().getHours();
  const part = h < 11 ? "Chào buổi sáng" : h < 14 ? "Chào buổi trưa" : h < 18 ? "Chào buổi chiều" : "Chào buổi tối";
  return name ? `${part}, ${name}` : "Chào mừng bạn quay lại";
}

export default function DashboardHomePage() {
  const { data: userData, isLoading: userLoading } = useCurrentUser();
  const { data: walletData } = useWallet();
  const { data: ordersData } = useOrders();
  const { data: notifData } = useNotifications();
  const { data: favoritesData } = useFavorites();
  const { data: downloadsData } = useDownloadHistory();
  const [continueSlug, setContinueSlug] = useState<string | null>(null);
  useEffect(() => {
    setContinueSlug(recentlyViewedSlugs(1)[0] ?? null);
  }, []);

  if (userLoading) return <LoadingBlock />;

  const user = userData?.user;
  const recentOrders = ordersData?.items.slice(0, 5) ?? [];
  const recentDownloads = downloadsData?.items.slice(0, 4) ?? [];
  const recentNotifications = notifData?.notifications.slice(0, 4) ?? [];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-h1 font-display text-white">
          {greeting(user?.displayName)} 👋
        </h1>
        <p className="mt-1 text-small text-white/45">Đây là tổng quan hoạt động gần đây của bạn trong Vault.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {continueSlug ? <Link href={`/san-pham/${continueSlug}`} className="rounded-full border border-white/10 px-4 py-2 text-small text-white/70">Tiếp tục xem sản phẩm</Link> : null}
        <Link href="/tai-xuong" className="rounded-full border border-white/10 px-4 py-2 text-small text-white/70">Tải gần đây</Link>
        <Link href="/san-pham" className="rounded-full border border-white/10 px-4 py-2 text-small text-white/70">Khám phá sản phẩm</Link>
        <Link href="/ho-tro" className="rounded-full border border-white/10 px-4 py-2 text-small text-white/70">Liên hệ hỗ trợ</Link>
      </div>

      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        <StatCard icon={Wallet} label="Số dư ví" value={formatVnd(walletData?.wallet.balance ?? 0)} />
        <StatCard
          icon={Package}
          label="Tổng đơn hàng"
          value={String(ordersData?.pagination.total ?? 0)}
        />
        <StatCard icon={Heart} label="Yêu thích" value={String(favoritesData?.favorites.length ?? 0)} />
        <StatCard icon={Download} label="Đã tải xuống" value={String(downloadsData?.pagination.total ?? 0)} />
      </div>

      <SectionCard title="Thẻ thành viên">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-h3 font-display text-accent-orange">{MEMBERSHIP_LABEL[user?.membershipTier ?? "FREE"]}</p>
            <p className="text-caption text-white/40">{user?.rewardPoints ?? 0} điểm thưởng</p>
          </div>
          <Link href="/thanh-vien" className="text-caption text-accent-orange/90 hover:text-accent-orange">
            Nâng cấp hạng thành viên →
          </Link>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="Đơn hàng gần đây" action={{ label: "Xem tất cả", href: "/don-hang" }}>
          {recentOrders.length === 0 ? (
            <EmptyState title="Chưa có đơn hàng" description="Các đơn hàng của bạn sẽ hiện ở đây." actionLabel="Khám phá sản phẩm" actionHref="/san-pham" />
          ) : (
            <ul className="flex flex-col divide-y divide-white/5">
              {recentOrders.map((order) => (
                <li key={order.id} className="flex items-center justify-between py-3">
                  <div>
                    <Link href={`/don-hang/${order.id}`} className="text-small text-white/80 hover:text-white">
                      {order.orderNumber}
                    </Link>
                    <p className="text-caption text-white/35">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn("rounded-pill px-2.5 py-1 text-caption", ORDER_STATUS_COLOR[order.status])}>
                      {ORDER_STATUS_LABEL[order.status]}
                    </span>
                    <span className="text-small text-white/70">{formatVnd(order.total)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Thông báo mới nhất" action={{ label: "Xem tất cả", href: "/thong-bao" }}>
          {recentNotifications.length === 0 ? (
            <EmptyState title="Không có thông báo" description="Thông báo mới sẽ xuất hiện tại đây." />
          ) : (
            <ul className="flex flex-col divide-y divide-white/5">
              {recentNotifications.map((n) => (
                <li key={n.id} className="flex items-start gap-3 py-3">
                  <Bell className={cn("mt-0.5 h-4 w-4 shrink-0", n.isRead ? "text-white/20" : "text-accent-orange")} />
                  <div>
                    <p className="text-small text-white/80">{n.title}</p>
                    <p className="text-caption text-white/35 line-clamp-1">{n.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Tải xuống gần đây" action={{ label: "Trung tâm tải xuống", href: "/tai-xuong" }}>
        {recentDownloads.length === 0 ? (
          <EmptyState title="Chưa có lượt tải nào" description="Sản phẩm bạn mua sẽ có sẵn để tải tại đây." actionLabel="Khám phá sản phẩm" actionHref="/san-pham" />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {recentDownloads.map((d) => (
              <Link
                key={d.id}
                href={`/san-pham/${d.product.slug}`}
                className="group flex flex-col items-center gap-2 rounded-md border border-white/5 p-3 text-center hover:border-white/15"
              >
                <span className="text-small text-white/75 line-clamp-1">{d.product.name}</span>
                <span className="text-caption text-white/30">v{d.product.version}</span>
              </Link>
            ))}
          </div>
        )}
      </SectionCard>

      <Link
        href="/san-pham"
        className="glass-surface flex items-center justify-between rounded-md p-5 text-white/70 hover:text-white"
      >
        <span className="text-small">Tiếp tục khám phá Marketplace</span>
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
