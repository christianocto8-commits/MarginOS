"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useOutlet } from "@/context/OutletContext";
import { formatIDR, formatNumber, calculateEffectiveUnitCost } from "@/lib/costing-engine";
import {
  Plus,
  Search,
  History,
  Edit2,
  Trash2,
  AlertTriangle,
  Package,
  Layers,
  Calendar,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

interface PriceHistoryItem {
  id: string;
  price: number;
  packageSize: number;
  purchaseUnit: string;
  changePercent: number;
  notes?: string;
  effectiveDate: string;
}

interface IngredientItem {
  id: string;
  name: string;
  sku?: string;
  category: string;
  supplier?: string;
  purchasePrice: number;
  packageSize: number;
  purchaseUnit: string;
  yieldPercent: number;
  isPackaging: boolean;
  currentStock: number;
  minStockAlert: number;
  defaultRecipeUnit: string;
  rawUnitCost: number;
  effectiveUnitCost: number;
  yieldMultiplier: number;
  priceChangePercent: number;
  hasPriceIncrease: boolean;
  priceHistory: PriceHistoryItem[];
}

const CATEGORIES = [
  "Semua Kategori",
  "Coffee Beans",
  "Dairy & Plant Milk",
  "Syrup & Flavor",
  "Protein",
  "Produce & Fresh",
  "Dry Goods & Grain",
  "Bakery & Dairy",
  "Packaging",
  "Other",
];

const COMMON_UNITS = [
  { value: "kg", label: "Kilogram (kg)" },
  { value: "gr", label: "Gram (gr)" },
  { value: "liter", label: "Liter (L)" },
  { value: "ml", label: "Mililiter (ml)" },
  { value: "pcs", label: "Pieces (pcs)" },
  { value: "pack", label: "Pack" },
  { value: "karton", label: "Karton / Dus" },
  { value: "butir", label: "Butir" },
  { value: "ikat", label: "Ikat" },
];

export default function IngredientsPage() {
  const { currentOutlet } = useOutlet();
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua Kategori");

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeHistory, setActiveHistory] = useState<IngredientItem | null>(null);
  const [editingItem, setEditingItem] = useState<IngredientItem | null>(null);

  // Form fields
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "Coffee Beans",
    supplier: "",
    purchasePrice: 50000,
    packageSize: 1,
    purchaseUnit: "kg",
    yieldPercent: 100,
    isPackaging: false,
    currentStock: 10,
    minStockAlert: 2,
    priceChangeNotes: "",
  });

  const [saving, setSaving] = useState(false);

  const fetchIngredients = useCallback(async () => {
    if (!currentOutlet) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/ingredients?outletId=${currentOutlet.id}`);
      if (res.ok) {
        const data = await res.json();
        setIngredients(data);
      }
    } catch (err) {
      console.error("Gagal memuat bahan baku:", err);
    } finally {
      setLoading(false);
    }
  }, [currentOutlet]);

  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      sku: "",
      category: "Coffee Beans",
      supplier: "",
      purchasePrice: 50000,
      packageSize: 1,
      purchaseUnit: "kg",
      yieldPercent: 100,
      isPackaging: false,
      currentStock: 10,
      minStockAlert: 2,
      priceChangeNotes: "",
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: IngredientItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      sku: item.sku || "",
      category: item.category,
      supplier: item.supplier || "",
      purchasePrice: item.purchasePrice,
      packageSize: item.packageSize,
      purchaseUnit: item.purchaseUnit,
      yieldPercent: item.yieldPercent,
      isPackaging: item.isPackaging,
      currentStock: item.currentStock,
      minStockAlert: item.minStockAlert,
      priceChangeNotes: "",
    });
    setIsFormOpen(true);
  };

  const handleOpenHistory = (item: IngredientItem) => {
    setActiveHistory(item);
    setIsHistoryOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOutlet) return;

    try {
      setSaving(true);
      if (editingItem) {
        const res = await fetch(`/api/ingredients/${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error("Gagal menyimpan perubahan");
      } else {
        const res = await fetch(`/api/ingredients`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, outletId: currentOutlet.id }),
        });
        if (!res.ok) throw new Error("Gagal menambahkan bahan baku");
      }
      setIsFormOpen(false);
      fetchIngredients();
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan saat menyimpan bahan baku.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus bahan baku "${name}"? Tindakan ini tidak dapat dibatalkan.`)) return;

    try {
      const res = await fetch(`/api/ingredients/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Gagal menghapus bahan.");
        return;
      }
      fetchIngredients();
    } catch {
      alert("Terjadi kesalahan jaringan.");
    }
  };

  const filteredIngredients = useMemo(() => {
    return ingredients.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.supplier && item.supplier.toLowerCase().includes(search.toLowerCase())) ||
        (item.sku && item.sku.toLowerCase().includes(search.toLowerCase()));

      const matchesCat =
        selectedCategory === "Semua Kategori" || item.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [ingredients, search, selectedCategory]);

  const livePreview = useMemo(() => {
    const defaultUnit = ["kg", "gr", "g", "mg", "ons"].includes(formData.purchaseUnit.toLowerCase())
      ? "gr"
      : ["liter", "l", "ml", "oz", "cup"].includes(formData.purchaseUnit.toLowerCase())
      ? "ml"
      : "pcs";

    const res = calculateEffectiveUnitCost(
      formData.purchasePrice,
      formData.packageSize,
      formData.purchaseUnit,
      defaultUnit,
      formData.yieldPercent
    );

    return {
      ...res,
      targetRecipeUnit: defaultUnit,
    };
  }, [formData.purchasePrice, formData.packageSize, formData.purchaseUnit, formData.yieldPercent]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.25)]">
              <Package className="w-4 h-4" />
            </div>
            Master Bahan Baku &amp; Yield
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Daftar harga beli bahan baku supplier, persentase susut siap pakai (Yield), dan biaya bersih per gram atau ml.
          </p>
        </div>
        <Button
          onClick={handleOpenAdd}
          variant="pill"
          size="default"
          className="shadow-[0_4px_20px_rgba(255,255,255,0.2)]"
        >
          <Plus className="w-4 h-4 mr-1 text-slate-950" />
          Tambah Bahan Baku
        </Button>
      </div>

      {/* Sub Navigation Bar - Tab Switcher */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-[#19191b] border border-white/[0.08] rounded-lg w-fit">
        <span className="px-3 py-1.5 rounded-md text-xs font-medium bg-[#232325] text-[#ededed] border border-white/[0.08] flex items-center gap-2">
          <Package className="w-3.5 h-3.5 text-amber-400" />
          Bahan Baku Mentah &amp; Yield
        </span>
        <Link
          href="/sub-recipes"
          className="px-3 py-1.5 rounded-md text-xs font-medium text-[#85858b] hover:text-[#ededed] hover:bg-white/[0.04] transition-colors flex items-center gap-2"
        >
          <Layers className="w-3.5 h-3.5 text-[#85858b]" />
          Sub-Recipe Olahan Dasar
        </Link>
      </div>

      {/* Quick Summary Counts (Dark Frosted Glass) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-[#181920]/80 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
          <div className="text-[11px] text-slate-400 font-medium">Total Bahan Terdaftar</div>
          <div className="text-xl font-black text-white mt-1">{ingredients.length} item</div>
        </div>
        <div className="p-4 bg-[#181920]/80 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
          <div className="text-[11px] text-slate-400 font-medium">Bahan dengan Susut (&lt;100%)</div>
          <div className="text-xl font-black text-amber-400 mt-1">
            {ingredients.filter((i) => i.yieldPercent < 100).length} item
          </div>
        </div>
        <div className="p-4 bg-[#181920]/80 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
          <div className="text-[11px] text-slate-400 font-medium">Item Khusus Kemasan</div>
          <div className="text-xl font-black text-blue-400 mt-1">
            {ingredients.filter((i) => i.isPackaging).length} item
          </div>
        </div>
        <div className="p-4 bg-[#181920]/80 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
          <div className="text-[11px] text-slate-400 font-medium">Kenaikan Harga Terakhir</div>
          <div className="text-xl font-black text-rose-400 mt-1">
            {ingredients.filter((i) => i.hasPriceIncrease).length} item
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#181920]/80 backdrop-blur-2xl p-3 rounded-2xl border border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Cari nama bahan, kode SKU, atau supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 text-xs bg-white/[0.03] border-white/[0.08] text-white placeholder:text-slate-500 rounded-xl"
            />
          </div>
          <div className="w-full sm:w-60">
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs bg-white/[0.03] border-white/[0.08] text-white rounded-xl"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-[#1a1b22] text-white">
                  {c}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* Table Data */}
      <div className="bg-[#181920]/80 backdrop-blur-2xl rounded-3xl border border-white/[0.08] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-white/[0.08] bg-[#18181b]">
                <TableHead className="w-[260px] text-zinc-200 font-bold text-xs uppercase tracking-wider">Nama Bahan &amp; Kategori</TableHead>
                <TableHead className="text-zinc-200 font-bold text-xs uppercase tracking-wider">Harga Beli Kemasan</TableHead>
                <TableHead className="text-zinc-200 font-bold text-xs uppercase tracking-wider">Yield Bersih</TableHead>
                <TableHead className="text-zinc-200 font-bold text-xs uppercase tracking-wider">Biaya Efektif Resep</TableHead>
                <TableHead className="text-zinc-200 font-bold text-xs uppercase tracking-wider">Stok Gudang</TableHead>
                <TableHead className="text-zinc-200 font-bold text-xs uppercase tracking-wider">Perubahan Harga</TableHead>
                <TableHead className="text-right text-zinc-200 font-bold text-xs uppercase tracking-wider">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-2" />
                    <div className="text-xs font-medium">Memuat data bahan baku...</div>
                  </TableCell>
                </TableRow>
              ) : filteredIngredients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-slate-400 text-xs font-medium">
                    Tidak ada bahan baku yang cocok dengan pencarian.
                  </TableCell>
                </TableRow>
              ) : (
                filteredIngredients.map((item) => (
                  <TableRow key={item.id} className="hover:bg-white/[0.03] border-b border-white/[0.05] transition-colors">
                    <TableCell>
                      <div className="font-bold text-white flex items-center gap-1.5 text-xs">
                        {item.name}
                        {item.isPackaging && (
                          <span className="text-[10px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">
                            Kemasan
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {item.category} {item.supplier ? `• ${item.supplier}` : ""} {item.sku ? `• SKU: ${item.sku}` : ""}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-white text-xs">
                        {formatIDR(item.purchasePrice)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        per {item.packageSize} {item.purchaseUnit}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-extrabold text-white">
                        {item.yieldPercent}%
                        {item.yieldPercent !== 100 && (
                          <span className="text-[11px] font-normal text-slate-400 ml-1">
                            ({formatNumber(item.yieldMultiplier, 2)}x)
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {item.yieldPercent < 100
                          ? "Susut trimming"
                          : item.yieldPercent > 100
                          ? "Mengembang"
                          : "Utuh 100%"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-black text-emerald-400 text-xs">
                        {formatIDR(item.effectiveUnitCost)}
                        <span className="text-[11px] font-normal text-slate-400"> / {item.defaultRecipeUnit}</span>
                      </div>
                      {item.yieldPercent !== 100 && (
                        <div className="text-[10px] text-slate-500">
                          Mentah: {formatIDR(item.rawUnitCost)}/{item.defaultRecipeUnit}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-slate-200 text-xs">
                        {formatNumber(item.currentStock)} {item.purchaseUnit}
                      </div>
                      {item.currentStock <= item.minStockAlert ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400">
                          <AlertTriangle className="w-3 h-3" /> Di bawah batas
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-400 font-bold">Aman</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.priceHistory && item.priceHistory.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => handleOpenHistory(item)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] cursor-pointer transition-colors text-slate-300"
                        >
                          {item.priceChangePercent > 0 ? (
                            <>
                              <TrendingUp className="w-3 h-3 text-rose-400" />
                              <span className="text-rose-400">+{formatNumber(item.priceChangePercent, 1)}%</span>
                            </>
                          ) : (
                            <>
                              <TrendingDown className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">{formatNumber(item.priceChangePercent, 1)}%</span>
                            </>
                          )}
                          <History className="w-3 h-3 text-slate-400 ml-0.5" />
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500">Stabil</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenHistory(item)}
                          title="Riwayat Harga"
                          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors border border-transparent hover:border-white/[0.1]"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          title="Edit Bahan"
                          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors border border-transparent hover:border-white/[0.1]"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id, item.name)}
                          title="Hapus Bahan"
                          className="p-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors border border-transparent hover:border-rose-500/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal Tambah / Edit Bahan */}
      <Dialog
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        maxWidth="3xl"
        title={editingItem ? "Edit Bahan Baku" : "Tambah Bahan Baku Baru"}
        description="Masukkan harga beli dan persentase yield untuk menghitung biaya efektif resep secara presisi."
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Identitas Bahan */}
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-4 border border-white/[0.08] space-y-3">
            <div className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">
              1. Identitas Bahan Baku
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Nama Bahan Baku *</Label>
                <Input
                  required
                  placeholder="Misal: Susu UHT 1 Liter"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="text-xs font-semibold bg-white/[0.04] border-white/[0.1] text-white rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Kategori Bahan *</Label>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="text-xs font-semibold bg-white/[0.04] border-white/[0.1] text-white rounded-xl"
                >
                  {CATEGORIES.filter((c) => c !== "Semua Kategori").map((c) => (
                    <option key={c} value={c} className="bg-[#1a1b22] text-white">
                      {c}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Nama Supplier</Label>
                <Input
                  placeholder="Misal: PT Diamond Cold Storage"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="text-xs bg-white/[0.04] border-white/[0.1] text-white rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Kode SKU / Barcode</Label>
                <Input
                  placeholder="Misal: ING-MILK-01"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="text-xs bg-white/[0.04] border-white/[0.1] text-white rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Bagian Pembelian & Kemasan */}
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-4 border border-white/[0.08] space-y-3">
            <div className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">
              2. Data Pembelian Kemasan &amp; Yield Bersih
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Harga Beli (Rp) *</Label>
                <Input
                  type="number"
                  required
                  min={0}
                  step={100}
                  value={formData.purchasePrice}
                  onChange={(e) =>
                    setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })
                  }
                  className="text-xs font-bold bg-white/[0.04] border-white/[0.1] text-white rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Ukuran Kemasan *</Label>
                <Input
                  type="number"
                  required
                  min={0.01}
                  step={0.1}
                  value={formData.packageSize}
                  onChange={(e) =>
                    setFormData({ ...formData, packageSize: parseFloat(e.target.value) || 1 })
                  }
                  className="text-xs font-bold bg-white/[0.04] border-white/[0.1] text-white rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Satuan Beli *</Label>
                <Select
                  value={formData.purchaseUnit}
                  onChange={(e) => setFormData({ ...formData, purchaseUnit: e.target.value })}
                  className="text-xs font-semibold bg-white/[0.04] border-white/[0.1] text-white rounded-xl"
                >
                  {COMMON_UNITS.map((u) => (
                    <option key={u.value} value={u.value} className="bg-[#1a1b22] text-white">
                      {u.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-300">Hasil Bersih Siap Pakai (Yield %)</Label>
                  <span className="text-xs font-black text-emerald-300 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    {formData.yieldPercent}%
                  </span>
                </div>
                <Input
                  type="number"
                  required
                  min={1}
                  max={500}
                  step={1}
                  value={formData.yieldPercent}
                  onChange={(e) =>
                    setFormData({ ...formData, yieldPercent: parseFloat(e.target.value) || 100 })
                  }
                  className="text-xs font-bold bg-white/[0.04] border-white/[0.1] text-white rounded-xl"
                />
                <p className="text-[10px] text-slate-500">
                  Gunakan 100% jika tanpa susut (susu, telur). Daging 75-80% (tulang/lemak terbuang). Beras 240% (mengembang).
                </p>
              </div>

              <div className="flex flex-col justify-center space-y-1 pt-1 bg-white/[0.03] p-3 rounded-2xl border border-white/[0.06]">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-200">
                  <input
                    type="checkbox"
                    checked={formData.isPackaging}
                    onChange={(e) => setFormData({ ...formData, isPackaging: e.target.checked })}
                    className="w-4 h-4 text-orange-500 rounded bg-white/[0.05] border-white/[0.1]"
                  />
                  <span>Bahan Khusus Kemasan / Packaging</span>
                </label>
                <p className="text-[10px] text-slate-400 pl-6">
                  Item kemasan otomatis dialokasikan ke pesanan Online Takeaway, bukan Dine-In.
                </p>
              </div>
            </div>

            {/* Hasil Kalkulasi Biaya Bersih */}
            <div className="p-3 bg-white/[0.04] backdrop-blur-xl rounded-2xl border border-white/[0.08] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-slate-400">
                Biaya dasar mentah: <strong className="text-white">{formatIDR(livePreview.rawUnitCost)} / {livePreview.targetRecipeUnit}</strong>
              </div>
              <div className="text-emerald-400 font-black text-xs">
                Biaya Efektif Bersih (+Yield {formData.yieldPercent}%): {formatIDR(livePreview.effectiveUnitCost)} / {livePreview.targetRecipeUnit}
              </div>
            </div>
          </div>

          {/* Stok Gudang & Minimum Alert */}
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-4 border border-white/[0.08] space-y-3">
            <div className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">
              3. Manajemen Stok Gudang
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Stok Saat Ini ({formData.purchaseUnit})</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.1}
                  value={formData.currentStock}
                  onChange={(e) =>
                    setFormData({ ...formData, currentStock: parseFloat(e.target.value) || 0 })
                  }
                  className="text-xs bg-white/[0.04] border-white/[0.1] text-white rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Batas Minimum Peringatan ({formData.purchaseUnit})</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.1}
                  value={formData.minStockAlert}
                  onChange={(e) =>
                    setFormData({ ...formData, minStockAlert: parseFloat(e.target.value) || 0 })
                  }
                  className="text-xs bg-white/[0.04] border-white/[0.1] text-white rounded-xl"
                />
              </div>
            </div>

            {editingItem && (
              <div className="space-y-1.5 pt-1">
                <Label className="text-xs font-bold text-slate-300">Catatan Perubahan Harga (Opsional)</Label>
                <Input
                  placeholder="Misal: Kenaikan harga supplier per awal bulan"
                  value={formData.priceChangeNotes}
                  onChange={(e) => setFormData({ ...formData, priceChangeNotes: e.target.value })}
                  className="text-xs bg-white/[0.04] border-white/[0.1] text-white rounded-xl"
                />
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFormOpen(false)}
              className="text-xs border-white/[0.15] bg-white/[0.04] hover:bg-white/[0.08] min-h-[40px] px-5 font-semibold text-slate-300 rounded-full"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={saving}
              variant="pill"
              className="min-h-[40px] px-6 text-xs font-black shadow-[0_4px_20px_rgba(255,255,255,0.2)]"
            >
              {saving ? "Menyimpan..." : editingItem ? "Simpan Perubahan" : "Simpan Bahan"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal Riwayat Perubahan Harga */}
      <Dialog
        open={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        title={`Riwayat Harga: ${activeHistory?.name || ""}`}
        description="Catatan riwayat perubahan harga beli dari supplier untuk melacak inflasi modal."
      >
        <div className="space-y-3 pt-2">
          {activeHistory && activeHistory.priceHistory && activeHistory.priceHistory.length > 0 ? (
            <div className="border border-white/[0.08] rounded-2xl divide-y divide-white/[0.06] text-xs overflow-hidden bg-white/[0.02]">
              {activeHistory.priceHistory.map((h, idx) => (
                <div key={h.id || idx} className="p-3.5 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white text-xs">
                      {formatIDR(h.price)} <span className="text-slate-400 font-normal">/ {h.packageSize} {h.purchaseUnit}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(h.effectiveDate).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                      {h.notes ? `• ${h.notes}` : ""}
                    </div>
                  </div>
                  <div>
                    {h.changePercent !== 0 ? (
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                          h.changePercent > 0
                            ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                            : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                        }`}
                      >
                        {h.changePercent > 0 ? `+${formatNumber(h.changePercent, 1)}%` : `${formatNumber(h.changePercent, 1)}%`}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500">Harga awal</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 p-4 text-center">Belum ada riwayat perubahan harga tercatat.</p>
          )}

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsHistoryOpen(false)}
              className="text-xs border-white/[0.15] bg-white/[0.04] text-slate-300 rounded-full px-5 py-2"
            >
              Tutup
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
