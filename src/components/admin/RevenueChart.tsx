"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatVnd } from "@/lib/format";

const ACCENT_ORANGE = "#FF8A3D";

function formatShortDay(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function formatCompactVnd(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}tr`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(value);
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; payload: { orders: number } }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const revenue = payload[0]!.value;
  const orders = payload[0]!.payload.orders;
  return (
    <div className="rounded-xl border border-white/10 bg-[#0b0f17]/95 px-3.5 py-2.5 shadow-2xl backdrop-blur-xl">
      <p className="text-caption text-white/40">{label ? formatShortDay(label) : ""}</p>
      <p className="mt-0.5 text-small font-semibold text-white">{formatVnd(revenue)}</p>
      <p className="text-caption text-white/35">{orders} đơn hàng</p>
    </div>
  );
}

export function RevenueChart({ data }: { data: { date: string; revenue: number; orders: number }[] }) {
  const hasAnyRevenue = data.some((d) => d.revenue > 0);

  return (
    <div className="h-[240px] w-full sm:h-[280px]">
      {!hasAnyRevenue ? (
        <div className="flex h-full items-center justify-center text-small text-white/30">Chưa có doanh thu trong 14 ngày qua.</div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="khvRevenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ACCENT_ORANGE} stopOpacity={0.35} />
                <stop offset="100%" stopColor={ACCENT_ORANGE} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatShortDay}
              tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={24}
            />
            <YAxis
              tickFormatter={formatCompactVnd}
              tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={44}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(255,138,61,0.25)", strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke={ACCENT_ORANGE}
              strokeWidth={2.5}
              fill="url(#khvRevenueFill)"
              activeDot={{ r: 4, fill: ACCENT_ORANGE, stroke: "#05070C", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
