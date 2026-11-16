"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useOutlet } from "@/context/OutletContext";
import { formatIDR, formatNumber } from "@/lib/costing-engine";
import {
  ShoppingBag,
  Plus,
  Receipt,
  Calendar,
  Building2,
  DollarSign,
  CreditCard,
  Trash2,
  CheckCircle2,
  Search,
  Package,
  Layers,
  FileText,
  Clock,
  ArrowDownLeft,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";

interface PurchaseItem {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  subtotal: number;
}

export default function PurchasesPage() {
  const { currentOutlet } = useOutlet();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    invoiceNumber: "",
    supplierName: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    paymentMethod: "TRANSFER",
    paymentStatus: "PAID",
    notes: "",
  });

  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = useCallback(async () => {
    if (!currentOutlet) return;
    try {
      setLoading(true);
      const [pRes, iRes] = await Promise.all([
        fetch(`/api/purchases?outletId=${currentOutlet.id}`),
        fetch(`/api/ingredients?outletId=${currentOutlet.id}`),
      ]);

      if (pRes.ok) {
        const pData = await pRes.json();
        setPurchases(pData.purchases || []);
        setStats(pData.stats || {});
      }

      if (iRes.ok) {
        const iData = await iRes.json();
        setIngredients(iData || []);
      }
    } catch (err) {
      console.error("Gagal memuat data belanja:", err);
      showToast("error", "Gagal memuat riwayat belanja dari server.");
    } finally {
      setLoading(false);
    }
  }, [currentOutlet]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenAdd = () => {
    const inv = `INV-PO-${Date.now().toString().slice(-6)}`;
    setForm({
      invoiceNumber: inv,
      supplierName: "",
      purchaseDate: new Date().toISOString().split("T")[0],
      paymentMethod: "TRANSFER",
      paymentStatus: "PAID",
      notes: "",
    });

    if (ingredients.length > 0) {
      const first = ingredients[0];
      setItems([
        {
          ingredientId: first.id,
          ingredientName: first.name,
          quantity: 1,
          unit: first.purchaseUnit || "kg",
          pricePerUnit: first.purchasePrice || 0,
          subtotal: first.purchasePrice || 0,
        },
      ]);
    } else {
      setItems([]);
    }

    setIsModalOpen(true);
  };

  const handleAddItemRow = () => {
    const first = ingredients[0] || null;
    setItems([
      ...items,
      {
        ingredientId: first?.id || "",
        ingredientName: first?.name || "Pilih Bahan",
        quantity: 1,
        unit: first?.purchaseUnit || "kg",
        pricePerUnit: first?.purchasePrice || 0,
        subtotal: first?.purchasePrice || 0,
      },
    ]);
  };

  const handleUpdateItem = (index: number, field: string, val: any) => {
    const next = [...items];
    const row = { ...next[index] };

    if (field === "ingredientId") {
      const found = ingredients.find((i) => i.id === val);
      if (found) {
        row.ingredientId = found.id;
        row.ingredientName = found.name;
        row.unit = found.purchaseUnit || "kg";
        row.pricePerUnit = found.purchasePrice || 0;
        row.subtotal = row.quantity * row.pricePerUnit;
      }
    } else if (field === "quantity") {
      row.quantity = parseFloat(val) || 0;
      row.subtotal = row.quantity * row.pricePerUnit;
    } else if (field === "pricePerUnit") {
      row.pricePerUnit = parseFloat(val) || 0;
      row.subtotal = row.quantity * row.pricePerUnit;
    }

    next[index] = row;
    setItems(next);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const totalBelanjaModal = items.reduce((acc, it) => acc + (it.subtotal || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOutlet) return;
    if (items.length === 0) {
      showToast("error", "Minimal tambahkan 1 item bahan yang dibeli.");
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          outletId: currentOutlet.id,
          items,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mencatat belanja");

      showToast("success", `Nota belanja ${form.invoiceNumber} berhasil dicatat & stok bertambah!`);
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredPurchases = purchases.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.invoiceNumber.toLowerCase().includes(q) ||
      p.supplierName.toLowerCase().includes(q) ||
      (p.notes && p.notes.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-xl animate-in fade-in slide-in-from-top-2 duration-200 ${
            toast.type === "success"
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/15 border-rose-500/30 text-rose-300"
          }`}
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {toast.text}
          </span>
          <button onClick={() => setToast(null)} className="text-xs opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
            <ShoppingBag className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              Pencatatan Belanja Bahan Masuk &amp; Supplier
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Catat nota belanja bahan baku harian/mingguan. Stok bahan di gudang otomatis bertambah dan histori harga beli langsung terupdate.
            </p>
          </div>
        </div>

        <Button
          onClick={handleOpenAdd}
          className="rounded-full bg-white hover:bg-slate-200 text-slate-950 text-xs font-black shadow-lg shadow-white/10 px-4 py-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Catat Belanja Nota Baru
        </Button>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[#181920]/80 backdrop-blur-2xl rounded-3xl border border-white/[0.08] p-4 flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Pengeluaran Belanja
            </span>
            <div className="text-xl font-black text-white mt-1">
              {formatIDR(stats.totalAmount || 0)}
            </div>
            <span className="text-[11px] text-emerald-400 font-medium">
              Dari {stats.totalTransactions || 0} nota belanja
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-emerald-400">
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        <div className="bg-[#181920]/80 backdrop-blur-2xl rounded-3xl border border-white/[0.08] p-4 flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Nota Belanja Tercatat
            </span>
            <div className="text-2xl font-black text-white mt-1">
              {stats.totalTransactions || 0} <span className="text-xs font-semibold text-slate-400">Nota</span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Outlet: {currentOutlet?.name || "-"}
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-amber-400">
            <Receipt className="w-5 h-5 text-amber-400" />
          </div>
        </div>

        <div className="bg-[#181920]/80 backdrop-blur-2xl rounded-3xl border border-white/[0.08] p-4 flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Supplier Utama
            </span>
            <div className="text-lg font-black text-white mt-1 truncate max-w-[150px]">
              {stats.topSupplier || "-"}
            </div>
            <span className="text-[11px] text-amber-400 font-medium">
              Paling sering dipesan
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-orange-400">
            <Building2 className="w-5 h-5 text-orange-400" />
          </div>
        </div>

        <div className="bg-[#181920]/80 backdrop-blur-2xl rounded-3xl border border-white/[0.08] p-4 flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Rata-rata per Belanja
            </span>
            <div className="text-xl font-black text-emerald-400 mt-1">
              {formatIDR(stats.avgTransaction || 0)}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Rata-rata modal per restock
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-emerald-400">
            <CreditCard className="w-5 h-5 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-[#181920]/80 backdrop-blur-2xl rounded-2xl border border-white/[0.08] p-3 flex items-center justify-between shadow-md">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Cari nomor nota, supplier, catatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs bg-white/[0.04] border-white/[0.08] text-white rounded-xl focus:border-amber-500/50"
          />
        </div>
      </div>

      {/* Purchases Table */}
      {loading ? (
        <div className="p-16 text-center text-slate-400">
          <div className="inline-block w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
          <div className="text-xs font-medium">Memuat riwayat nota belanja...</div>
        </div>
      ) : filteredPurchases.length === 0 ? (
        <Card className="p-10 text-center text-slate-400 bg-[#181920]/80 border-white/[0.08] rounded-3xl text-xs">
          Belum ada riwayat nota belanja bahan yang tercatat. Klik &quot;Catat Belanja Nota Baru&quot; untuk mencatat belanja pertama.
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-white/[0.08] bg-[#181920]/80 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
          <table className="w-full text-xs divide-y divide-white/[0.08]">
            <thead className="bg-[#18181b] text-zinc-200 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3.5 text-left w-12">No</th>
                <th className="p-3.5 text-left">No. Nota / Faktur</th>
                <th className="p-3.5 text-left">Tanggal</th>
                <th className="p-3.5 text-left">Supplier / Pasar</th>
                <th className="p-3.5 text-left">Rincian Bahan yang Dibeli</th>
                <th className="p-3.5 text-left">Metode Bayar</th>
                <th className="p-3.5 text-right pr-4">Total Belanja</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredPurchases.map((p, idx) => (
                <tr key={p.id} className="hover:bg-white/[0.04] transition-colors">
                  <td className="p-3.5 text-zinc-400 font-bold">{idx + 1}</td>
                  <td className="p-3.5">
                    <div className="font-mono font-bold text-white text-xs flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-amber-400" />
                      {p.invoiceNumber}
                    </div>
                  </td>
                  <td className="p-3.5 text-slate-300">
                    {new Date(p.purchaseDate).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="p-3.5">
                    <div className="font-bold text-white">{p.supplierName}</div>
                    {p.notes && <span className="text-[10px] text-slate-400">{p.notes}</span>}
                  </td>
                  <td className="p-3.5">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {p.items?.map((it: any, iIdx: number) => (
                        <span
                          key={iIdx}
                          className="text-[10px] bg-white/[0.04] text-slate-300 px-2 py-0.5 rounded-md border border-white/[0.06]"
                        >
                          {it.ingredientName}: {it.quantity} {it.unit}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3.5">
                    <Badge className="bg-white/[0.06] text-slate-300 border-white/[0.1] text-[10px] font-bold rounded-full">
                      {p.paymentMethod}
                    </Badge>
                  </td>
                  <td className="p-3.5 text-right pr-4 font-black text-emerald-400 text-sm">
                    {formatIDR(p.totalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Catat Belanja Nota Baru */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="2xl"
        title="Catat Belanja Bahan Masuk (Nota Supplier)"
        description="Pilih bahan baku yang dibeli, harga nota, dan kuantitas. Stok di sistem akan bertambah otomatis."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">No. Faktur / Nota *</Label>
              <Input
                required
                value={form.invoiceNumber}
                onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
                className="text-xs bg-[#16171d] border-white/[0.1] text-white rounded-xl font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Nama Supplier / Toko *</Label>
              <Input
                required
                value={form.supplierName}
                onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
                placeholder="Misal: Toko Susu Diamond, Pasar Kramat Jati"
                className="text-xs bg-[#16171d] border-white/[0.1] text-white rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Tanggal Belanja</Label>
              <Input
                type="date"
                value={form.purchaseDate}
                onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                className="text-xs bg-[#16171d] border-white/[0.1] text-white rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Metode Pembayaran</Label>
              <Select
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                className="text-xs bg-[#16171d] border-white/[0.1] text-white rounded-xl"
              >
                <option value="TRANSFER" className="bg-[#16171d]">Transfer Bank / QRIS</option>
                <option value="CASH" className="bg-[#16171d]">Tunai / Cash Toko</option>
                <option value="TEMPO_UTANG" className="bg-[#16171d]">Tempo / Hutang Dagang</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Catatan Belanja</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Misal: Stok untuk persiapan weekend..."
                className="text-xs bg-[#16171d] border-white/[0.1] text-white rounded-xl"
              />
            </div>
          </div>

          {/* Daftar Bahan yang Dibeli */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Daftar Bahan yang Dibeli ({items.length})
              </span>
              <Button
                type="button"
                size="sm"
                onClick={handleAddItemRow}
                className="bg-white/[0.08] hover:bg-white/[0.15] text-white text-[11px] font-bold rounded-full h-7 px-3"
              >
                <Plus className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Tambah Baris Bahan
              </Button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {items.map((row, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white/[0.03] rounded-2xl border border-white/[0.06] flex flex-col sm:flex-row items-center gap-2 text-xs"
                >
                  <div className="flex-1 w-full sm:w-auto">
                    <Select
                      value={row.ingredientId}
                      onChange={(e) => handleUpdateItem(idx, "ingredientId", e.target.value)}
                      className="text-xs bg-[#16171d] border-white/[0.1] text-white rounded-xl h-9"
                    >
                      {ingredients.map((ing) => (
                        <option key={ing.id} value={ing.id} className="bg-[#16171d]">
                          {ing.name} ({ing.purchaseUnit})
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={0.1}
                        step={0.1}
                        value={row.quantity}
                        onChange={(e) => handleUpdateItem(idx, "quantity", e.target.value)}
                        placeholder="Qty"
                        className="w-16 text-center text-xs bg-[#16171d] border-white/[0.1] text-white rounded-xl h-9"
                      />
                      <span className="text-[11px] text-slate-400">{row.unit}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-slate-400">@Rp</span>
                      <Input
                        type="number"
                        min={0}
                        step={1000}
                        value={row.pricePerUnit}
                        onChange={(e) => handleUpdateItem(idx, "pricePerUnit", e.target.value)}
                        placeholder="Harga"
                        className="w-24 text-right text-xs bg-[#16171d] border-white/[0.1] text-white rounded-xl h-9"
                      />
                    </div>

                    <div className="w-24 text-right font-bold text-emerald-400 shrink-0">
                      {formatIDR(row.subtotal)}
                    </div>

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Total Footer */}
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-between mt-2">
              <span className="text-xs font-bold text-slate-300">Total Nominal Pembelian Nota:</span>
              <span className="text-lg font-black text-emerald-400">{formatIDR(totalBelanjaModal)}</span>
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
              disabled={actionLoading}
              className="rounded-full bg-white hover:bg-slate-200 text-slate-950 font-black text-xs px-5 shadow-lg shadow-white/10"
            >
              {actionLoading ? "Menyimpan & Menambah Stok..." : "Simpan Nota Belanja"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
