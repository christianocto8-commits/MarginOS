"use client";

import React, { useState, useEffect } from "react";
import { useOutlet } from "@/context/OutletContext";
import { formatIDR } from "@/lib/costing-engine";
import {
  Store,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  MapPin,
  Phone,
  Target,
  DollarSign,
  UtensilsCrossed,
  Package,
  Layers,
  ArrowRight,
  Sliders,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";

export default function OutletsPage() {
  const { outlets, currentOutlet, setCurrentOutlet, refreshOutlets } = useOutlet();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<any>(null);

  const [form, setForm] = useState({
    name: "",
    code: "",
    category: "Coffee Shop",
    address: "",
    phone: "",
    targetFoodCostPercent: 30,
    monthlyFixedCost: 15000000,
  });

  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showNotification = (type: "success" | "error", text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleOpenAdd = () => {
    setEditingOutlet(null);
    setForm({
      name: "",
      code: `OUT-${Math.floor(100 + Math.random() * 900)}`,
      category: "Coffee Shop",
      address: "",
      phone: "",
      targetFoodCostPercent: 30,
      monthlyFixedCost: 15000000,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (outlet: any) => {
    setEditingOutlet(outlet);
    setForm({
      name: outlet.name,
      code: outlet.code,
      category: outlet.category || "Coffee Shop",
      address: outlet.address || "",
      phone: outlet.phone || "",
      targetFoodCostPercent: outlet.targetFoodCostPercent || 30,
      monthlyFixedCost: outlet.monthlyFixedCost || 15000000,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const url = "/api/outlets";
      const method = editingOutlet ? "PUT" : "POST";
      const payload = editingOutlet ? { ...form, id: editingOutlet.id } : form;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan cabang outlet");

      showNotification("success", `Cabang "${form.name}" berhasil disimpan.`);
      setIsModalOpen(false);
      refreshOutlets();
    } catch (err: any) {
      showNotification("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (outlet: any) => {
    if (!confirm(`Hapus cabang "${outlet.name}"? Semua resep dan bahan di cabang ini akan terhapus.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/outlets?id=${outlet.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus cabang");

      showNotification("success", `Cabang "${outlet.name}" berhasil dihapus.`);
      refreshOutlets();
    } catch (err: any) {
      showNotification("error", err.message);
    }
  };

  const totalFixedCosts = outlets.reduce((acc, o) => acc + (o.monthlyFixedCost || 0), 0);
  const avgTargetFoodCost = outlets.length > 0
    ? (outlets.reduce((acc, o) => acc + (o.targetFoodCostPercent || 0), 0) / outlets.length).toFixed(1)
    : "30.0";

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-xl animate-in fade-in slide-in-from-top-2 duration-200 ${
            notification.type === "success"
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/15 border-rose-500/30 text-rose-300"
          }`}
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {notification.text}
          </span>
          <button onClick={() => setNotification(null)} className="text-xs opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
            <Store className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              Manajemen Cabang &amp; Multi-Outlet
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Kelola seluruh cabang kafe/resto Anda, atur target food cost %, serta biaya sewa dan gaji operasional tetap toko.
            </p>
          </div>
        </div>

        <Button
          onClick={handleOpenAdd}
          className="rounded-full bg-white hover:bg-slate-200 text-slate-950 text-xs font-black shadow-lg shadow-white/10 px-4 py-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Tambah Cabang Baru
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-[#181920]/80 backdrop-blur-2xl rounded-3xl border border-white/[0.08] p-4 flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Cabang Aktif
            </span>
            <div className="text-2xl font-black text-white mt-1">
              {outlets.length} <span className="text-xs font-semibold text-slate-400">Cabang</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-medium">
              Cabang terpilih: {currentOutlet?.name || "-"}
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-amber-400">
            <Store className="w-5 h-5 text-amber-400" />
          </div>
        </div>

        <div className="bg-[#181920]/80 backdrop-blur-2xl rounded-3xl border border-white/[0.08] p-4 flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Rata-rata Target Food Cost
            </span>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {avgTargetFoodCost}%
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Batas toleransi biaya modal resep
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-emerald-400">
            <Target className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        <div className="bg-[#181920]/80 backdrop-blur-2xl rounded-3xl border border-white/[0.08] p-4 flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Beban Operasional Tetap
            </span>
            <div className="text-xl font-black text-white mt-1">
              {formatIDR(totalFixedCosts)}
              <span className="text-xs font-normal text-slate-400">/bln</span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Total gaji &amp; sewa seluruh cabang
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-orange-400">
            <DollarSign className="w-5 h-5 text-orange-400" />
          </div>
        </div>
      </div>

      {/* Grid of Outlets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {outlets.map((o) => {
          const isCurrent = o.id === currentOutlet?.id;

          return (
            <div
              key={o.id}
              className={`bg-[#181920]/80 backdrop-blur-2xl rounded-3xl border p-5 shadow-[0_15px_40px_rgba(0,0,0,0.5)] flex flex-col justify-between transition-all ${
                isCurrent
                  ? "border-amber-500/40 ring-1 ring-amber-500/40 shadow-amber-500/5"
                  : "border-white/[0.08] hover:border-white/[0.15]"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-white/[0.08] text-slate-300 border-white/[0.1] text-[10px] font-bold rounded-full">
                        {o.code}
                      </Badge>
                      {isCurrent && (
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] font-bold rounded-full">
                          ● Sedang Aktif
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-black text-base text-white mt-1.5">{o.name}</h3>
                    <span className="text-xs text-amber-400/90 font-semibold">{o.category}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(o)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-xl transition-colors cursor-pointer"
                      title="Edit Cabang"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {outlets.length > 1 && (
                      <button
                        onClick={() => handleDelete(o)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                        title="Hapus Cabang"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Info Detail Box */}
                <div className="bg-white/[0.03] rounded-2xl p-3 border border-white/[0.06] space-y-2 text-xs">
                  {o.address && (
                    <div className="flex items-start gap-1.5 text-slate-300 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{o.address}</span>
                    </div>
                  )}
                  {o.phone && (
                    <div className="flex items-center gap-1.5 text-slate-300 text-[11px]">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{o.phone}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Target Food Cost:</span>
                    <span className="font-bold text-emerald-400">{o.targetFoodCostPercent}%</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Beban Sewa &amp; Gaji Toko:</span>
                    <span className="font-bold text-white">{formatIDR(o.monthlyFixedCost || 0)}/bln</span>
                  </div>
                </div>
              </div>

              {/* Bottom Switch Button */}
              <div className="pt-4 border-t border-white/[0.06] mt-3">
                {isCurrent ? (
                  <div className="w-full text-center py-2 text-xs font-bold text-amber-400/90 bg-amber-500/[0.06] rounded-full border border-amber-500/20">
                    ✓ Cabang Workspace Aktif
                  </div>
                ) : (
                  <Button
                    onClick={() => {
                      setCurrentOutlet(o);
                      showNotification("success", `Beralih workspace ke ${o.name}`);
                    }}
                    className="w-full rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white text-xs font-bold h-9 transition-all flex items-center justify-center gap-1.5"
                  >
                    Beralih ke Cabang Ini <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Tambah / Edit Cabang */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="md"
        title={editingOutlet ? "Edit Data Cabang Outlet" : "Tambah Cabang F&B Baru"}
        description="Atur identitas cabang, target persentase modal, dan estimasi biaya operasional tetap toko."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8 space-y-1.5">
              <Label className="text-xs text-slate-300">Nama Cabang Outlet *</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Misal: Kopi Senja - Cabang Tebet"
                className="text-xs bg-[#16171d] border-white/[0.1] text-white rounded-xl"
              />
            </div>
            <div className="sm:col-span-4 space-y-1.5">
              <Label className="text-xs text-slate-300">Kode Cabang *</Label>
              <Input
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="OUT-01"
                className="text-xs bg-[#16171d] border-white/[0.1] text-white rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Kategori Usaha</Label>
              <Select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="text-xs bg-[#16171d] border-white/[0.1] text-white rounded-xl"
              >
                <option value="Coffee Shop" className="bg-[#16171d]">Coffee Shop / Kafe</option>
                <option value="Restaurant" className="bg-[#16171d]">Restoran / Rumah Makan</option>
                <option value="Bakery" className="bg-[#16171d]">Bakery &amp; Pastry</option>
                <option value="Cloud Kitchen" className="bg-[#16171d]">Cloud Kitchen / Delivery Only</option>
                <option value="Catering" className="bg-[#16171d]">Katering &amp; Event</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Nomor Telepon Toko</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="021-xxxxxxx / 0812-xxxx"
                className="text-xs bg-[#16171d] border-white/[0.1] text-white rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-300">Alamat Lengkap Cabang</Label>
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Jl. Tebet Raya No. 45, Jakarta Selatan"
              className="text-xs bg-[#16171d] border-white/[0.1] text-white rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Target Food Cost (%)</Label>
              <Input
                type="number"
                min={1}
                max={99}
                value={form.targetFoodCostPercent}
                onChange={(e) => setForm({ ...form, targetFoodCostPercent: parseFloat(e.target.value) || 30 })}
                className="text-xs bg-[#16171d] border-white/[0.1] text-white rounded-xl"
              />
              <span className="text-[10px] text-slate-500">Standar F&amp;B: 28% - 35%</span>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Beban Tetap Toko (Sewa + Gaji Toko)</Label>
              <Input
                type="number"
                min={0}
                step={500000}
                value={form.monthlyFixedCost}
                onChange={(e) => setForm({ ...form, monthlyFixedCost: parseFloat(e.target.value) || 0 })}
                className="text-xs bg-[#16171d] border-white/[0.1] text-white rounded-xl"
              />
              <span className="text-[10px] text-slate-500">Dipakai untuk simulator Titik Impas (BEP)</span>
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.08] flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="rounded-full border-white/[0.1] text-slate-300 text-xs px-4"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-full bg-white hover:bg-slate-200 text-slate-950 font-black text-xs px-5 shadow-lg shadow-white/10"
            >
              {loading ? "Menyimpan..." : "Simpan Cabang"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
