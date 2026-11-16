"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useOutlet } from "@/context/OutletContext";
import { formatIDR, formatNumber, calculateEffectiveUnitCost } from "@/lib/costing-engine";
import {
  Layers,
  Plus,
  Search,
  Trash2,
  Edit2,
  Clock,
  Thermometer,
  Package,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";

interface SubRecipeItem {
  id?: string;
  ingredientId: string;
  quantity: number;
  unit: string;
  notes?: string;
  ingredient?: {
    id: string;
    name: string;
    purchasePrice: number;
    packageSize: number;
    purchaseUnit: string;
    yieldPercent: number;
    category: string;
  };
}

interface SubRecipe {
  id: string;
  name: string;
  category: string;
  description?: string;
  batchYield: number;
  batchUnit: string;
  shelfLifeDays: number;
  storageMethod?: string;
  directLaborCost: number;
  overheadCost: number;
  items: SubRecipeItem[];
  rawIngredientsCost: number;
  totalBatchCost: number;
  costPerYieldUnit: number;
}

interface AvailableIngredient {
  id: string;
  name: string;
  purchasePrice: number;
  packageSize: number;
  purchaseUnit: string;
  yieldPercent: number;
  category: string;
  effectiveUnitCost: number;
  defaultRecipeUnit: string;
}

const SUB_CATEGORIES = [
  "Semua Kategori",
  "Syrup / Pemanis",
  "Saus / Sambal",
  "Bumbu Dasar",
  "Adonan Roti / Pastry",
  "Kaldu / Broth",
  "Pre-mix / Bubuk",
  "Topping / Garnish",
];

export default function SubRecipesPage() {
  const { currentOutlet } = useOutlet();
  const [subRecipes, setSubRecipes] = useState<SubRecipe[]>([]);
  const [availableIngredients, setAvailableIngredients] = useState<AvailableIngredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua Kategori");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubRecipe, setEditingSubRecipe] = useState<SubRecipe | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    category: "Syrup / Pemanis",
    description: "",
    batchYield: 1000,
    batchUnit: "ml",
    shelfLifeDays: 7,
    storageMethod: "Chiller 4°C wadah kedap udara",
    directLaborCost: 2000,
    overheadCost: 1000,
  });

  const [formItems, setFormItems] = useState<
    Array<{
      ingredientId: string;
      quantity: number;
      unit: string;
      notes: string;
    }>
  >([]);

  const fetchData = useCallback(async () => {
    if (!currentOutlet) return;
    try {
      setLoading(true);
      const [resSub, resIng] = await Promise.all([
        fetch(`/api/sub-recipes?outletId=${currentOutlet.id}`),
        fetch(`/api/ingredients?outletId=${currentOutlet.id}`),
      ]);

      if (resSub.ok && resIng.ok) {
        const subData = await resSub.json();
        const ingData = await resIng.json();
        setSubRecipes(subData);
        setAvailableIngredients(ingData);
      }
    } catch (err) {
      console.error("Gagal memuat sub-resep:", err);
    } finally {
      setLoading(false);
    }
  }, [currentOutlet]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenAdd = () => {
    setEditingSubRecipe(null);
    setFormData({
      name: "",
      category: "Syrup / Pemanis",
      description: "",
      batchYield: 1000,
      batchUnit: "ml",
      shelfLifeDays: 7,
      storageMethod: "Chiller 4°C wadah tertutup",
      directLaborCost: 2000,
      overheadCost: 1000,
    });

    if (availableIngredients.length > 0) {
      setFormItems([
        {
          ingredientId: availableIngredients[0].id,
          quantity: 100,
          unit: availableIngredients[0].defaultRecipeUnit || "gr",
          notes: "",
        },
      ]);
    } else {
      setFormItems([]);
    }
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sub: SubRecipe) => {
    setEditingSubRecipe(sub);
    setFormData({
      name: sub.name,
      category: sub.category,
      description: sub.description || "",
      batchYield: sub.batchYield,
      batchUnit: sub.batchUnit,
      shelfLifeDays: sub.shelfLifeDays,
      storageMethod: sub.storageMethod || "",
      directLaborCost: sub.directLaborCost,
      overheadCost: sub.overheadCost,
    });

    setFormItems(
      sub.items.map((it) => ({
        ingredientId: it.ingredientId,
        quantity: it.quantity,
        unit: it.unit,
        notes: it.notes || "",
      }))
    );
    setIsModalOpen(true);
  };

  const handleAddItemRow = () => {
    if (availableIngredients.length === 0) return;
    setFormItems([
      ...formItems,
      {
        ingredientId: availableIngredients[0].id,
        quantity: 100,
        unit: availableIngredients[0].defaultRecipeUnit || "gr",
        notes: "",
      },
    ]);
  };

  const handleRemoveItemRow = (idx: number) => {
    setFormItems(formItems.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: string, value: any) => {
    const updated = [...formItems];
    updated[idx] = { ...updated[idx], [field]: value };

    if (field === "ingredientId") {
      const ing = availableIngredients.find((i) => i.id === value);
      if (ing) {
        updated[idx].unit = ing.defaultRecipeUnit || "gr";
      }
    }

    setFormItems(updated);
  };

  const liveCost = useMemo(() => {
    let rawTotal = 0;
    const itemCalculations = formItems.map((item) => {
      const ing = availableIngredients.find((i) => i.id === item.ingredientId);
      if (!ing) return { cost: 0, name: "-" };

      const { effectiveUnitCost } = calculateEffectiveUnitCost(
        ing.purchasePrice,
        ing.packageSize,
        ing.purchaseUnit,
        item.unit,
        ing.yieldPercent
      );

      const cost = effectiveUnitCost * item.quantity;
      rawTotal += cost;
      return { cost, name: ing.name };
    });

    const totalBatch = rawTotal + (Number(formData.directLaborCost) || 0) + (Number(formData.overheadCost) || 0);
    const perUnit = formData.batchYield > 0 ? totalBatch / formData.batchYield : 0;

    return {
      rawTotal,
      totalBatch,
      perUnit,
      itemCalculations,
    };
  }, [formItems, availableIngredients, formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOutlet) return;
    if (formItems.length === 0) {
      alert("Masukkan minimal 1 bahan baku untuk sub-resep ini.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        outletId: currentOutlet.id,
        ...formData,
        items: formItems,
      };

      if (editingSubRecipe) {
        const res = await fetch(`/api/sub-recipes/${editingSubRecipe.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Gagal memperbarui sub-resep");
      } else {
        const res = await fetch(`/api/sub-recipes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Gagal membuat sub-resep");
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan sub-resep.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus sub-resep "${name}"? Tindakan ini tidak dapat dibatalkan.`)) return;

    try {
      const res = await fetch(`/api/sub-recipes/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Gagal menghapus sub-resep.");
        return;
      }
      fetchData();
    } catch {
      alert("Terjadi kesalahan jaringan.");
    }
  };

  const filteredSubRecipes = useMemo(() => {
    return subRecipes.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.description && s.description.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory =
        selectedCategory === "Semua Kategori" || s.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [subRecipes, search, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.25)]">
              <Layers className="w-4 h-4" />
            </div>
            Sub-Recipe Olahan Dasar
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Hitung biaya pembuatan adonan, saus, kaldu, atau sirup dalam 1 batch, dan dapatkan modal per gram atau ml untuk menu utama.
          </p>
        </div>
        <Button onClick={handleOpenAdd} variant="pill" size="default" className="shadow-[0_4px_20px_rgba(255,255,255,0.2)] flex items-center gap-1.5 min-h-[44px]">
          <Plus className="w-4 h-4" />
          Buat Sub-Recipe Baru
        </Button>
      </div>

      {/* Sub Navigation Bar - Tab Switcher */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-[#19191b] border border-white/[0.08] rounded-lg w-fit">
        <Link
          href="/ingredients"
          className="px-3 py-1.5 rounded-md text-xs font-medium text-[#85858b] hover:text-[#ededed] hover:bg-white/[0.04] transition-colors flex items-center gap-2"
        >
          <Package className="w-3.5 h-3.5 text-[#85858b]" />
          Bahan Baku Mentah &amp; Yield
        </Link>
        <span className="px-3 py-1.5 rounded-md text-xs font-medium bg-[#232325] text-[#ededed] border border-white/[0.08] flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          Sub-Recipe Olahan Dasar
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#181920]/80 backdrop-blur-2xl p-3 rounded-2xl border border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Cari nama olahan dasar atau saus..."
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
              {SUB_CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-[#1a1b22] text-white">
                  {c}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* Grid of Sub-Recipes */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">
          <div className="inline-block w-6 h-6 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin mb-2" />
          <div className="text-xs">Memuat data sub-resep...</div>
        </div>
      ) : filteredSubRecipes.length === 0 ? (
        <Card className="p-10 text-center text-slate-500">
          <Layers className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-200">Belum ada Sub-Recipe</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Buat resep olahan dasar untuk bahan setengah jadi seperti sirup aren, saus pasta, atau adonan roti.
          </p>
          <Button onClick={handleOpenAdd} className="mt-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs">
            <Plus className="w-4 h-4 mr-1" /> Buat Sub-Recipe Pertama
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubRecipes.map((sub) => (
            <div key={sub.id} className="bg-[#181920]/80 backdrop-blur-2xl rounded-3xl border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-5 hover:border-white/[0.15] transition-all">
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge variant="outline" className="text-[10px] bg-white/60 backdrop-blur-md text-slate-700 border-white/80 mb-1">
                      {sub.category}
                    </Badge>
                    <h3 className="font-extrabold text-sm text-white line-clamp-1">{sub.name}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(sub)}
                      className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/60 rounded-lg cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors"
                      title="Edit Sub-Recipe"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(sub.id, sub.name)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-500/10 rounded-lg cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors"
                      title="Hapus Sub-Recipe"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {sub.description && (
                  <p className="text-xs text-slate-400 line-clamp-2">{sub.description}</p>
                )}

                {/* Batch Cost Box */}
                <div className="p-3.5 bg-white/[0.03] backdrop-blur-md rounded-2xl border border-white/[0.06] space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Hasil 1 Batch:</span>
                    <span className="font-bold text-white">
                      {formatNumber(sub.batchYield)} {sub.batchUnit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Biaya Batch:</span>
                    <span className="font-bold text-white">{formatIDR(sub.totalBatchCost)}</span>
                  </div>
                  <div className="pt-1.5 border-t border-white/[0.08]/60 flex justify-between items-baseline">
                    <span className="font-bold text-emerald-400">Biaya per {sub.batchUnit}:</span>
                    <span className="text-base font-black text-emerald-400">
                      {formatIDR(sub.costPerYieldUnit)}
                      <span className="text-[10px] font-normal text-slate-400"> / {sub.batchUnit}</span>
                    </span>
                  </div>
                </div>

                {/* Komposisi Bahan */}
                <div className="space-y-1 text-xs">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Bahan Penyusun ({sub.items.length})
                  </span>
                  <div className="divide-y divide-white/[0.05]">
                    {sub.items.map((it, idx) => (
                      <div key={idx} className="py-1 flex items-center justify-between">
                        <span className="text-slate-200 font-semibold truncate max-w-[160px]">
                          {it.ingredient?.name || "Bahan Baku"}
                        </span>
                        <span className="text-slate-400 font-semibold">
                          {formatNumber(it.quantity)} {it.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Masa Simpan */}
                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Simpan {sub.shelfLifeDays} hari
                  </span>
                  {sub.storageMethod && (
                    <span className="flex items-center gap-1 truncate max-w-[130px]" title={sub.storageMethod}>
                      <Thermometer className="w-3.5 h-3.5 text-blue-500" />
                      <span className="truncate">{sub.storageMethod}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Buat / Edit Sub-Recipe - Simple & User Friendly */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="3xl"
        title={editingSubRecipe ? "Edit Sub-Recipe Olahan" : "Buat Sub-Recipe Baru"}
        description="Gabungkan bahan baku mentah menjadi 1 batch olahan dengan kalkulasi modal per gram/ml."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Identitas Sub-Recipe */}
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-4 border border-white/[0.08] space-y-3">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              1. Identitas Olahan Dasar
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
              <div className="sm:col-span-8 space-y-1">
                <Label className="text-xs font-semibold text-slate-200">Nama Sub-Recipe *</Label>
                <Input
                  required
                  placeholder="Misal: House Aren Syrup / Saus Bolognese"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="text-xs"
                />
              </div>
              <div className="sm:col-span-4 space-y-1">
                <Label className="text-xs font-semibold text-slate-200">Kategori Sub-Recipe *</Label>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="text-xs font-semibold"
                >
                  {SUB_CATEGORIES.filter((c) => c !== "Semua Kategori").map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="sm:col-span-12 space-y-1">
                <Label className="text-xs font-semibold text-slate-200">Instruksi Singkat Olahan</Label>
                <Input
                  placeholder="Misal: Didihkan gula aren dan air hingga larut, saring lalu simpan di chiller"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>
          </div>

          {/* Hasil Batch & Masa Simpan */}
          <div className="bg-[#1e1e22] rounded-xl p-4 border border-white/[0.08] space-y-3">
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              2. Hasil Jadi 1 Batch &amp; Penyimpanan
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-200">Hasil 1 Batch *</Label>
                <Input
                  type="number"
                  required
                  min={0.01}
                  step={0.1}
                  value={formData.batchYield}
                  onChange={(e) =>
                    setFormData({ ...formData, batchYield: parseFloat(e.target.value) || 1 })
                  }
                  className="text-xs font-semibold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-200">Satuan Jadi *</Label>
                <Select
                  value={formData.batchUnit}
                  onChange={(e) => setFormData({ ...formData, batchUnit: e.target.value })}
                  className="text-xs font-semibold"
                >
                  <option value="ml">Mililiter (ml)</option>
                  <option value="gr">Gram (gr)</option>
                  <option value="liter">Liter (L)</option>
                  <option value="kg">Kilogram (kg)</option>
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="porsi">Porsi</option>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-200">Masa Simpan (Hari)</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.shelfLifeDays}
                  onChange={(e) =>
                    setFormData({ ...formData, shelfLifeDays: parseInt(e.target.value) || 1 })
                  }
                  className="text-xs font-semibold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-200">Suhu Simpan</Label>
                <Input
                  placeholder="Chiller 4°C"
                  value={formData.storageMethod}
                  onChange={(e) => setFormData({ ...formData, storageMethod: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            {/* Tenaga Kerja & Biaya Energi Batch */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-white/[0.08]">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-200">Upah Tenaga Kerja per Batch (Rp)</Label>
                <Input
                  type="number"
                  min={0}
                  step={500}
                  value={formData.directLaborCost}
                  onChange={(e) =>
                    setFormData({ ...formData, directLaborCost: parseFloat(e.target.value) || 0 })
                  }
                  className="text-xs font-semibold"
                />
                <span className="text-[10px] text-zinc-400">Upah koki atau barista menyiapkan batch</span>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-200">Overhead Gas / Listrik per Batch (Rp)</Label>
                <Input
                  type="number"
                  min={0}
                  step={500}
                  value={formData.overheadCost}
                  onChange={(e) =>
                    setFormData({ ...formData, overheadCost: parseFloat(e.target.value) || 0 })
                  }
                  className="text-xs font-semibold"
                />
                <span className="text-[10px] text-zinc-400">Alokasi energi memasak / pendinginan</span>
              </div>
            </div>
          </div>

          {/* Dynamic Ingredient Rows */}
          <div className="bg-[#1e1e22] rounded-xl p-4 border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <span className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-400" />
                Bahan Baku Penyusun Batch
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItemRow}
                className="text-xs bg-[#242428] hover:bg-[#2e2e33] text-zinc-100 border-white/[0.12] font-semibold"
              >
                <Plus className="w-3.5 h-3.5 mr-1 text-emerald-400" /> + Tambah Bahan
              </Button>
            </div>

            <div className="space-y-2">
              {formItems.map((item, idx) => {
                const rowCalc = liveCost.itemCalculations[idx];
                return (
                  <div
                    key={idx}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center p-3 rounded-lg border border-white/[0.08] bg-[#161619]"
                  >
                    <div className="sm:col-span-6">
                      <Select
                        value={item.ingredientId}
                        onChange={(e) => handleItemChange(idx, "ingredientId", e.target.value)}
                        className="text-xs font-medium"
                      >
                        {availableIngredients.map((ing) => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name} ({ing.category}) - {formatIDR(ing.purchasePrice)}/{ing.packageSize}{ing.purchaseUnit}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div className="sm:col-span-3 flex items-center gap-1.5">
                      <Input
                        type="number"
                        min={0.01}
                        step={0.1}
                        placeholder="Jumlah"
                        className="text-right text-xs font-semibold"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(idx, "quantity", parseFloat(e.target.value) || 0)
                        }
                      />
                      <Select
                        className="w-20 text-xs font-semibold"
                        value={item.unit}
                        onChange={(e) => handleItemChange(idx, "unit", e.target.value)}
                      >
                        <option value="gr">gr</option>
                        <option value="kg">kg</option>
                        <option value="ml">ml</option>
                        <option value="liter">liter</option>
                        <option value="pcs">pcs</option>
                        <option value="butir">butir</option>
                      </Select>
                    </div>

                    <div className="sm:col-span-2 text-right">
                      <div className="font-extrabold text-xs text-zinc-100">
                        {formatIDR(rowCalc?.cost || 0)}
                      </div>
                      <div className="text-[10px] text-zinc-400">Subtotal</div>
                    </div>

                    <div className="sm:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        className="text-zinc-400 hover:text-rose-400 p-2 rounded-lg hover:bg-rose-500/10 cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors"
                        title="Hapus baris"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ringkasan Biaya Sub-Recipe */}
          <div className="p-3.5 bg-[#1e1e22] border border-white/[0.08] rounded-xl space-y-2 text-xs shadow-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 bg-[#161619] rounded-lg border border-white/[0.08]">
                <span className="text-zinc-400 text-[11px] block">Bahan Baku:</span>
                <div className="font-bold text-zinc-100 text-sm mt-0.5">{formatIDR(liveCost.rawTotal)}</div>
              </div>
              <div className="p-2.5 bg-[#161619] rounded-lg border border-white/[0.08]">
                <span className="text-zinc-400 text-[11px] block">Labor &amp; Overhead:</span>
                <div className="font-bold text-zinc-100 text-sm mt-0.5">
                  {formatIDR((Number(formData.directLaborCost) || 0) + (Number(formData.overheadCost) || 0))}
                </div>
              </div>
              <div className="p-2.5 bg-[#161619] rounded-lg border border-white/[0.08]">
                <span className="text-zinc-400 text-[11px] block">Total 1 Batch:</span>
                <div className="font-extrabold text-zinc-100 text-sm mt-0.5">{formatIDR(liveCost.totalBatch)}</div>
              </div>
              <div className="bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/25">
                <span className="text-emerald-400 font-semibold text-[11px] block">Modal per {formData.batchUnit}:</span>
                <div className="text-sm font-extrabold text-emerald-300 mt-0.5">
                  {formatIDR(liveCost.perUnit)}
                </div>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]/70">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="text-xs border-slate-300 bg-white hover:bg-slate-50 min-h-[40px] px-4 font-semibold text-slate-700"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={saving}
              variant="pill" className="text-xs font-black min-h-[40px] px-6 shadow-[0_4px_20px_rgba(255,255,255,0.2)]"
            >
              {saving ? "Menyimpan..." : editingSubRecipe ? "Simpan Perubahan" : "Simpan Sub-Recipe"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
