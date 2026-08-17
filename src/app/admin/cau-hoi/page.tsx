"use client";
import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api-client";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
type FAQ = { id: string; question: string; answer: string; sortOrder: number; isActive: boolean };
const blank = { question: "", answer: "", sortOrder: 0, isActive: true };
export default function AdminFaqPage() {
  const [items, setItems] = useState<FAQ[]>([]); const [form, setForm] = useState(blank); const [editing, setEditing] = useState<string | null>(null); const [loading, setLoading] = useState(true); const { show } = useToast();
  const load = useCallback(async () => { setLoading(true); try { const data = await api.get<{ items: FAQ[] }>("/api/admin/faqs"); setItems(data.items); } catch (e) { show(e instanceof Error ? e.message : "Không thể tải FAQ.", "error"); } finally { setLoading(false); } }, [show]);
  useEffect(() => { void load(); }, [load]);
  const save = async () => { if (!form.question.trim() || !form.answer.trim()) return show("Vui lòng nhập câu hỏi và câu trả lời.", "error"); try { if (editing) await api.patch(`/api/admin/faqs/${editing}`, form); else await api.post("/api/admin/faqs", form); show(editing ? "Đã cập nhật FAQ." : "Đã thêm FAQ.", "success"); setForm(blank); setEditing(null); await load(); } catch (e) { show(e instanceof Error ? e.message : "Không thể lưu FAQ.", "error"); } };
  const edit = (item: FAQ) => { setEditing(item.id); setForm({ question: item.question, answer: item.answer, sortOrder: item.sortOrder, isActive: item.isActive }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const remove = async (id: string) => { if (!confirm("Xóa FAQ này?")) return; try { await api.delete(`/api/admin/faqs/${id}`); show("Đã xóa FAQ.", "success"); await load(); } catch (e) { show(e instanceof Error ? e.message : "Không thể xóa FAQ.", "error"); } };
  return <div className="flex flex-col gap-6"><div><h1 className="text-h2 font-display text-white">Câu hỏi thường gặp</h1><p className="mt-2 text-small text-white/45">Quản lý nội dung FAQ hiển thị trên website.</p></div>
    <GlassPanel radius="md" className="p-5"><div className="mb-4 flex items-center justify-between"><h2 className="text-title text-white">{editing ? "Chỉnh sửa FAQ" : "Thêm FAQ"}</h2>{editing && <button onClick={() => { setEditing(null); setForm(blank); }} className="text-caption text-white/45 hover:text-white">Hủy sửa</button>}</div>
      <div className="grid gap-4 lg:grid-cols-2"><Input label="Câu hỏi" value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} /><Input label="Thứ tự" type="number" min={0} value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: Number(e.target.value) || 0 })} /></div>
      <div className="mt-4"><label className="mb-2 block text-small text-white/70">Câu trả lời</label><textarea value={form.answer} onChange={e => setForm({ ...form, answer: e.target.value })} rows={5} className="w-full rounded-2xl border border-white/10 bg-white/[.03] px-4 py-3 text-small leading-7 text-white outline-none focus:border-accent-orange/50" /></div>
      <label className="mt-4 flex items-center gap-2 text-small text-white/65"><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} /> Hiển thị trên website</label><Button className="mt-5" onClick={save}>{editing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{editing ? "Lưu thay đổi" : "Thêm FAQ"}</Button>
    </GlassPanel>
    <GlassPanel radius="md" className="overflow-hidden p-0">{loading ? <div className="p-6 text-small text-white/45">Đang tải...</div> : <div className="divide-y divide-white/5">{items.map(item => <div key={item.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0"><div className="flex items-center gap-2"><span className={cn("rounded-full px-2 py-1 text-[10px]", item.isActive ? "bg-state-success/10 text-state-success" : "bg-white/5 text-white/35")}>{item.isActive ? "Published" : "Hidden"}</span><span className="text-caption text-white/30">#{item.sortOrder}</span></div><h3 className="mt-2 text-title text-white">{item.question}</h3><p className="mt-2 whitespace-pre-wrap text-small leading-7 text-white/45">{item.answer}</p></div><div className="flex shrink-0 gap-2"><button onClick={() => edit(item)} className="rounded-xl border border-white/10 p-2 text-white/50 hover:text-white" aria-label="Sửa"><Pencil className="h-4 w-4" /></button><button onClick={async () => { try { await api.patch(`/api/admin/faqs/${item.id}`, { isActive: !item.isActive }); await load(); } catch {} }} className="rounded-xl border border-white/10 p-2 text-white/50 hover:text-white" aria-label="Ẩn/hiện">{item.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button><button onClick={() => remove(item.id)} className="rounded-xl border border-state-danger/10 p-2 text-state-danger/70 hover:text-state-danger" aria-label="Xóa"><Trash2 className="h-4 w-4" /></button></div></div>)}</div>}</GlassPanel>
  </div>;
}
