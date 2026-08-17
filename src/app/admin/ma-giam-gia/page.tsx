"use client";

import { useState } from "react";
import { Plus, Tag, Trash2, Power, Sparkles } from "lucide-react";
import { useAdminCoupons, useCreateCoupon, useToggleCoupon, useDeleteCoupon } from "@/hooks/admin/useAdminCoupons";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api-client";
import { formatVnd } from "@/lib/format";

const EMPTY = { code: "", description: "", discountType: "PERCENT" as "PERCENT" | "FIXED", discountValue: 10, usageLimit: "", minTier: "FREE" as "FREE" | "SILVER" | "GOLD" | "DIAMOND", expiresAt: "" };

export default function AdminCouponsPage() {
  const { data, isLoading } = useAdminCoupons();
  const create = useCreateCoupon();
  const toggle = useToggleCoupon();
  const remove = useDeleteCoupon();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const coupons = data?.coupons ?? [];

  const submit = () => {
    const code = form.code.trim().toUpperCase();
    if (code.length < 2) return toast.show("Mã giảm giá tối thiểu 2 ký tự.", "error");
    create.mutate({ code, description: form.description || undefined, discountType: form.discountType, discountValue: Number(form.discountValue), usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined, minTier: form.minTier, expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined }, {
      onSuccess: () => { toast.show("Đã tạo mã giảm giá.", "success"); setOpen(false); setForm(EMPTY); },
      onError: (e) => toast.show(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Không thể tạo mã giảm giá.", "error")
    });
  };

  return <div className="page-enter flex flex-col gap-6">
    <div className="flex items-center justify-between gap-4">
      <div><div className="mb-2 flex items-center gap-2 text-accent-orange"><Sparkles className="h-4 w-4"/><span className="text-[10px] font-bold uppercase tracking-[.2em]">Growth Center</span></div><h1 className="text-h2 font-display text-white">Mã giảm giá</h1><p className="mt-1 text-small text-white/45">Tạo chiến dịch ưu đãi, giới hạn lượt dùng và kiểm soát trạng thái theo thời gian thực.</p></div>
      <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4"/> Tạo mã</Button>
    </div>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3"><GlassPanel className="p-5"><p className="text-caption uppercase tracking-[.15em] text-white/35">Tổng mã</p><p className="mt-2 text-3xl font-bold text-white">{coupons.length}</p></GlassPanel><GlassPanel className="p-5"><p className="text-caption uppercase tracking-[.15em] text-white/35">Đang hoạt động</p><p className="mt-2 text-3xl font-bold text-state-success">{coupons.filter(c=>c.isActive).length}</p></GlassPanel><GlassPanel className="p-5"><p className="text-caption uppercase tracking-[.15em] text-white/35">Lượt sử dụng</p><p className="mt-2 text-3xl font-bold text-accent-orange">{coupons.reduce((n,c)=>n+c.usageCount,0)}</p></GlassPanel></div>
    <GlassPanel className="overflow-hidden p-0">
      {isLoading ? <div className="p-8 text-white/40">Đang tải...</div> : coupons.length === 0 ? <div className="flex flex-col items-center gap-3 p-12 text-center"><Tag className="h-8 w-8 text-white/20"/><p className="text-white/60">Chưa có mã giảm giá.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-small"><thead><tr className="border-b border-white/10 text-caption text-white/40"><th className="px-5 py-4">Mã</th><th>Ưu đãi</th><th>Sử dụng</th><th>Hạng</th><th>Hết hạn</th><th className="px-5 text-right">Thao tác</th></tr></thead><tbody>{coupons.map(c=><tr key={c.id} className="border-b border-white/5 hover:bg-white/[.025]"><td className="px-5 py-4"><span className="rounded-lg border border-accent-orange/20 bg-accent-orange/5 px-3 py-1.5 font-mono font-bold tracking-wider text-accent-orange">{c.code}</span><p className="mt-2 text-caption text-white/35">{c.description || "Không có mô tả"}</p></td><td>{c.discountType === "PERCENT" ? `${Number(c.discountValue)}%` : formatVnd(c.discountValue)}</td><td>{c.usageCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</td><td>{c.minTier}</td><td>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("vi-VN") : "Không giới hạn"}</td><td className="px-5"><div className="flex justify-end gap-2"><button onClick={()=>toggle.mutate({id:c.id,isActive:!c.isActive})} className={`rounded-lg border p-2 ${c.isActive?"border-state-success/20 text-state-success":"border-white/10 text-white/35"}`} title={c.isActive?"Tắt":"Bật"}><Power className="h-4 w-4"/></button><button onClick={()=>remove.mutate(c.id,{onSuccess:()=>toast.show("Đã xóa mã.","success")})} className="rounded-lg border border-white/10 p-2 text-white/35 hover:border-state-danger/30 hover:text-state-danger" title="Xóa"><Trash2 className="h-4 w-4"/></button></div></td></tr>)}</tbody></table></div>}
    </GlassPanel>
    <Modal open={open} title="Tạo mã giảm giá" onClose={()=>setOpen(false)}><div className="flex flex-col gap-4"><Input label="Mã giảm giá" value={form.code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})} placeholder="WELCOME10"/><Input label="Mô tả" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Ưu đãi dành cho khách mới"/><div className="grid grid-cols-2 gap-3"><div><label className="mb-2 block text-small text-white/70">Loại</label><select value={form.discountType} onChange={e=>setForm({...form,discountType:e.target.value as typeof form.discountType})} className="w-full rounded-md border border-white/10 bg-bg-secondary px-4 py-3 text-white"><option value="PERCENT">Phần trăm (%)</option><option value="FIXED">Số tiền (VND)</option></select></div><Input label="Giá trị" type="number" value={form.discountValue} onChange={e=>setForm({...form,discountValue:Number(e.target.value)})}/></div><div className="grid grid-cols-2 gap-3"><Input label="Giới hạn lượt dùng" type="number" value={form.usageLimit} onChange={e=>setForm({...form,usageLimit:e.target.value})} placeholder="Không giới hạn"/><div><label className="mb-2 block text-small text-white/70">Hạng tối thiểu</label><select value={form.minTier} onChange={e=>setForm({...form,minTier:e.target.value as typeof form.minTier})} className="w-full rounded-md border border-white/10 bg-bg-secondary px-4 py-3 text-white"><option>FREE</option><option>SILVER</option><option>GOLD</option><option>DIAMOND</option></select></div></div><Input label="Ngày hết hạn" type="datetime-local" value={form.expiresAt} onChange={e=>setForm({...form,expiresAt:e.target.value})}/><Button onClick={submit} isLoading={create.isPending}>Tạo mã giảm giá</Button></div></Modal>
  </div>;
}
