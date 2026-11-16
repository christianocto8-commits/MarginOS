"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useOutlet } from "@/context/OutletContext";
import {
  formatIDR,
  formatNumber,
  calculateEffectiveUnitCost,
  calculateMenuHPP,
  suggestSellingPrice,
  getFoodCostColorClass,
  getFoodCostBadgeVariant,
  MenuCostItem,
} from "@/lib/costing-engine";
import {
  UtensilsCrossed,
  Plus,
  Search,
  Edit2,
  Trash2,
  Layers,
  ShoppingBag,
  Store,
  Sliders,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Calculator,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Dialog } from "@/components/ui/dialog";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

interface RecipeItemForm {
  itemType: "ingredient" | "sub_recipe";
  ingredientId?: string;
  subRecipeId?: string;
  quantity: number;
  unit: string;
  channel: "all" | "dine_in_only" | "online_only";
  notes?: string;
}

const MENU_CATEGORIES = [
  "Semua Kategori",
  "Coffee & Espresso",
  "Non-Coffee & Tea",
  "Main Course",
  "Pastry & Bakery",
  "Snacks & Appetizers",
  "Dessert",
  "Catering Box",
];

export default function MenusPage() {
  const { currentOutlet } = useOutlet();
  const [menus, setMenus] = useState<any[]>([]);
  const [availableIngredients, setAvailableIngredients] = useState<any[]>([]);
  const [availableSubRecipes, setAvailableSubRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua Kategori");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "Coffee & Espresso",
    description: "",
    sellingPriceDineIn: 25000,
    sellingPriceOnline: 30000,
    monthlySalesVolume: 250,
    wastePercent: 3.0,
    directLaborCost: 1500,
    targetFoodCostPercent: 30.0,
    onlinePlatformCommissionPercent: 20.0,
    onlinePlatformFlatFee: 1000.0,
    merchantPromoSharePercent: 0.0,
  });

  const [recipeItems, setRecipeItems] = useState<RecipeItemForm[]>([]);

  const fetchData = useCallback(async () => {
    if (!currentOutlet) return;
    try {
      setLoading(true);
      const [resMenus, resIng, resSub] = await Promise.all([
        fetch(`/api/menus?outletId=${currentOutlet.id}`),
        fetch(`/api/ingredients?outletId=${currentOutlet.id}`),
        fetch(`/api/sub-recipes?outletId=${currentOutlet.id}`),
      ]);

      if (resMenus.ok && resIng.ok && resSub.ok) {
        const mData = await resMenus.json();
        const iData = await resIng.json();
        const sData = await resSub.json();
        setMenus(mData.menus || []);
        setAvailableIngredients(iData || []);
        setAvailableSubRecipes(sData || []);
      }
    } catch (err) {
      console.error("Gagal memuat data menu:", err);
    } finally {
      setLoading(false);
    }
  }, [currentOutlet]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenAdd = () => {
    setEditingMenu(null);
    setShowAdvanced(false);
    setFormData({
      name: "",
      sku: "",
      category: "Coffee & Espresso",
      description: "",
      sellingPriceDineIn: 25000,
      sellingPriceOnline: 30000,
      monthlySalesVolume: 250,
      wastePercent: 3.0,
      directLaborCost: 1500,
      targetFoodCostPercent: 30.0,
      onlinePlatformCommissionPercent: 20.0,
      onlinePlatformFlatFee: 1000.0,
      merchantPromoSharePercent: 0.0,
    });

    if (availableIngredients.length > 0) {
      setRecipeItems([
        {
          itemType: "ingredient",
          ingredientId: availableIngredients[0].id,
          quantity: 20,
          unit: availableIngredients[0].defaultRecipeUnit || "gr",
          channel: "all",
          notes: "",
        },
      ]);
    } else {
      setRecipeItems([]);
    }
    setIsModalOpen(true);
  };

  const handleOpenEdit = (menu: any) => {
    setEditingMenu(menu);
    setShowAdvanced(false);
    setFormData({
      name: menu.name,
      sku: menu.sku || "",
      category: menu.category,
      description: menu.description || "",
      sellingPriceDineIn: menu.sellingPriceDineIn,
      sellingPriceOnline: menu.sellingPriceOnline,
      monthlySalesVolume: menu.monthlySalesVolume,
      wastePercent: menu.wastePercent,
      directLaborCost: menu.directLaborCost,
      targetFoodCostPercent: menu.targetFoodCostPercent,
      onlinePlatformCommissionPercent: menu.onlinePlatformCommissionPercent,
      onlinePlatformFlatFee: menu.onlinePlatformFlatFee,
      merchantPromoSharePercent: menu.merchantPromoSharePercent,
    });

    setRecipeItems(
      menu.recipeItems.map((it: any) => ({
        itemType: it.itemType || "ingredient",
        ingredientId: it.ingredientId || undefined,
        subRecipeId: it.subRecipeId || undefined,
        quantity: it.quantity,
        unit: it.unit,
        channel: it.channel || "all",
        notes: it.notes || "",
      }))
    );
    setIsModalOpen(true);
  };

  const handleAddItemRow = (type: "ingredient" | "sub_recipe") => {
    if (type === "ingredient") {
      if (availableIngredients.length === 0) return;
      setRecipeItems([
        ...recipeItems,
        {
          itemType: "ingredient",
          ingredientId: availableIngredients[0].id,
          quantity: 10,
          unit: availableIngredients[0].defaultRecipeUnit || "gr",
          channel: "all",
          notes: "",
        },
      ]);
    } else {
      if (availableSubRecipes.length === 0) {
        alert("Belum ada Sub-Recipe yang terdaftar. Buat di menu Sub-Recipe terlebih dahulu.");
        return;
      }
      setRecipeItems([
        ...recipeItems,
        {
          itemType: "sub_recipe",
          subRecipeId: availableSubRecipes[0].id,
          quantity: 30,
          unit: availableSubRecipes[0].batchUnit || "ml",
          channel: "all",
          notes: "",
        },
      ]);
    }
  };

  const handleRemoveItemRow = (idx: number) => {
    setRecipeItems(recipeItems.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: string, value: any) => {
    const updated = [...recipeItems];
    updated[idx] = { ...updated[idx], [field]: value };

    if (field === "ingredientId") {
      const ing = availableIngredients.find((i) => i.id === value);
      if (ing) {
        updated[idx].unit = ing.defaultRecipeUnit || "gr";
        if (ing.isPackaging) {
          updated[idx].channel = "online_only";
        }
      }
    } else if (field === "subRecipeId") {
      const sub = availableSubRecipes.find((s) => s.id === value);
      if (sub) {
        updated[idx].unit = sub.batchUnit || "ml";
      }
    }

    setRecipeItems(updated);
  };

  const liveCalculation = useMemo(() => {
    const costItems: MenuCostItem[] = recipeItems.map((item) => {
      let unitCost = 0;
      let itemName = "";
      let isPkg = false;

      if (item.itemType === "sub_recipe" && item.subRecipeId) {
        const sub = availableSubRecipes.find((s) => s.id === item.subRecipeId);
        if (sub) {
          itemName = sub.name;
          unitCost = sub.costPerYieldUnit || 0;
        }
      } else if (item.ingredientId) {
        const ing = availableIngredients.find((i) => i.id === item.ingredientId);
        if (ing) {
          itemName = ing.name;
          isPkg = ing.isPackaging;
          const { effectiveUnitCost } = calculateEffectiveUnitCost(
            ing.purchasePrice,
            ing.packageSize,
            ing.purchaseUnit,
            item.unit,
            ing.yieldPercent
          );
          unitCost = effectiveUnitCost;
        }
      }

      return {
        itemType: item.itemType,
        name: itemName,
        quantity: item.quantity,
        unit: item.unit,
        channel: item.channel,
        unitCost,
        subtotal: unitCost * item.quantity,
        isPackaging: isPkg,
      };
    });

    const hpp = calculateMenuHPP(
      costItems,
      Number(formData.wastePercent) || 0,
      Number(formData.directLaborCost) || 0
    );

    const dineInPrice = Number(formData.sellingPriceDineIn) || 0;
    const onlinePrice = Number(formData.sellingPriceOnline) || 0;

    const dineInFoodCostPct = dineInPrice > 0 ? (hpp.dineInTotalHPP / dineInPrice) * 100 : 0;
    const onlineFoodCostPct = onlinePrice > 0 ? (hpp.onlineTotalHPP / onlinePrice) * 100 : 0;

    const recDineInPrice = suggestSellingPrice(hpp.dineInTotalHPP, Number(formData.targetFoodCostPercent) || 30);
    const recOnlinePrice = suggestSellingPrice(hpp.onlineTotalHPP, Number(formData.targetFoodCostPercent) || 30);

    return {
      costItems,
      hpp,
      dineInFoodCostPct,
      onlineFoodCostPct,
      recDineInPrice,
      recOnlinePrice,
    };
  }, [recipeItems, availableIngredients, availableSubRecipes, formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOutlet) return;
    if (recipeItems.length === 0) {
      alert("Masukkan minimal 1 bahan baku atau sub-resep untuk menu ini.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        outletId: currentOutlet.id,
        ...formData,
        recipeItems,
      };

      if (editingMenu) {
        const res = await fetch(`/api/menus/${editingMenu.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Gagal memperbarui menu");
      } else {
        const res = await fetch(`/api/menus`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Gagal membuat menu baru");
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan menu.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus menu "${name}"? Tindakan ini tidak dapat dibatalkan.`)) return;

    try {
      const res = await fetch(`/api/menus/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Gagal menghapus menu.");
        return;
      }
      fetchData();
    } catch {
      alert("Terjadi kesalahan jaringan.");
    }
  };

  const filteredMenus = useMemo(() => {
    return menus.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        (m.sku && m.sku.toLowerCase().includes(search.toLowerCase()));
      const matchesCat =
        selectedCategory === "Semua Kategori" || m.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [menus, search, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.25)]">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            Kalkulator HPP Menu &amp; Recipe Builder
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Susun resep dari Bahan Baku + Sub-Recipe + Kemasan, hitung toleransi waste, dan pisahkan HPP Dine-In vs Online Delivery secara presisi.
          </p>
        </div>
        <Button
          onClick={handleOpenAdd}
          variant="pill"
          size="default"
          className="shadow-[0_4px_20px_rgba(255,255,255,0.2)]"
        >
          <Plus className="w-4 h-4 mr-1 text-slate-950" />
          Buat Resep Menu Baru
        </Button>
      </div>

      {/* Sub Navigation Bar - Tab Switcher */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-[#19191b] border border-white/[0.08] rounded-lg w-fit">
        <span className="px-3 py-1.5 rounded-md text-xs font-medium bg-[#232325] text-[#ededed] border border-white/[0.08] flex items-center gap-2">
          <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" />
          Katalog &amp; Resep HPP
        </span>
        <Link
          href="/pricing-simulator"
          className="px-3 py-1.5 rounded-md text-xs font-medium text-[#85858b] hover:text-[#ededed] hover:bg-white/[0.04] transition-colors flex items-center gap-2"
        >
          <Calculator className="w-3.5 h-3.5 text-[#85858b]" />
          Simulator Komisi Ojol (GoFood / Grab)
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#181920]/80 backdrop-blur-2xl p-3 rounded-2xl border border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Cari nama menu atau kode SKU..."
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
              {MENU_CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-[#1a1b22] text-white">
                  {c}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* Menus Table */}
      <div className="bg-[#181920]/80 backdrop-blur-2xl rounded-3xl border border-white/[0.08] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-white/[0.08] bg-[#18181b]">
                <TableHead className="w-[260px] text-zinc-200 font-bold text-xs uppercase tracking-wider">Menu &amp; Kategori</TableHead>
                <TableHead className="text-zinc-200 font-bold text-xs uppercase tracking-wider">Harga Jual</TableHead>
                <TableHead className="text-zinc-200 font-bold text-xs uppercase tracking-wider">HPP Dine-In</TableHead>
                <TableHead className="text-zinc-200 font-bold text-xs uppercase tracking-wider">HPP Online Delivery</TableHead>
                <TableHead className="text-zinc-200 font-bold text-xs uppercase tracking-wider">Food Cost %</TableHead>
                <TableHead className="text-zinc-200 font-bold text-xs uppercase tracking-wider">Laba Kotor</TableHead>
                <TableHead className="text-zinc-200 font-bold text-xs uppercase tracking-wider">Kuadran</TableHead>
                <TableHead className="text-right text-zinc-200 font-bold text-xs uppercase tracking-wider">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-2" />
                    <div className="text-xs font-medium">Memuat data menu dan kalkulasi HPP...</div>
                  </TableCell>
                </TableRow>
              ) : filteredMenus.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-slate-400 text-xs font-medium">
                    Tidak ada menu yang terdaftar atau cocok dengan pencarian.
                  </TableCell>
                </TableRow>
              ) : (
                filteredMenus.map((menu) => (
                  <TableRow key={menu.id} className="hover:bg-white/[0.03] border-b border-white/[0.05] transition-colors">
                    <TableCell>
                      <div className="font-bold text-white text-xs">{menu.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {menu.category} {menu.sku ? `• SKU: ${menu.sku}` : ""} • {menu.recipeItems?.length || 0} bahan
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs">
                        <Store className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-bold text-slate-200">{formatIDR(menu.sellingPriceDineIn)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-orange-400" />
                        <span>{formatIDR(menu.sellingPriceOnline)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-extrabold text-white text-xs">
                        {formatIDR(menu.dineIn?.totalHPP || 0)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Waste: {menu.wastePercent}% ({formatIDR(menu.dineIn?.wasteCost || 0)})
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-extrabold text-blue-400 text-xs">
                        {formatIDR(menu.onlineDelivery?.totalHPP || 0)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Kemasan: +{formatIDR(menu.onlineDelivery?.packagingCost || 0)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getFoodCostBadgeVariant(menu.dineIn?.foodCostPercent || 0)}
                        className="font-bold text-xs"
                      >
                        {formatNumber(menu.dineIn?.foodCostPercent || 0, 1)}%
                      </Badge>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Target {menu.targetFoodCostPercent}%
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-emerald-400 text-xs">
                        +{formatIDR(menu.dineIn?.grossProfit || 0)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Margin {formatNumber(menu.dineIn?.grossMarginPercent || 0, 1)}%
                      </div>
                    </TableCell>
                    <TableCell>
                      {menu.matrix ? (
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border backdrop-blur-md ${
                            menu.matrix.quadrant === "Star"
                              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                              : menu.matrix.quadrant === "Plowhorse"
                              ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
                              : menu.matrix.quadrant === "Puzzle"
                              ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                              : "bg-rose-500/15 text-rose-300 border-rose-500/30"
                          }`}
                        >
                          {menu.matrix.quadrant}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(menu)}
                          title="Edit Resep Menu"
                          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors border border-transparent hover:border-white/[0.1]"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(menu.id, menu.name)}
                          title="Hapus Menu"
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

      {/* Modal Recipe Builder - Enhanced Dark Obsidian Frosted Glass Layout */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="4xl"
        title={editingMenu ? "Edit Resep & Kalkulator HPP Menu" : "Buat Resep Menu & Kalkulasi HPP"}
        description="Susun komponen bahan baku, sub-recipe olahan, dan kemasan delivery secara presisi."
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Section 1: Informasi Dasar Menu */}
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-4 border border-white/[0.08] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-8 space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Nama Menu *</Label>
                <Input
                  required
                  placeholder="Misal: Es Kopi Susu Gula Aren"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="text-xs font-semibold bg-white/[0.04] border-white/[0.1] text-white placeholder:text-slate-500 rounded-xl"
                />
              </div>
              <div className="sm:col-span-4 space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Kategori Menu *</Label>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="text-xs font-semibold bg-white/[0.04] border-white/[0.1] text-white rounded-xl"
                >
                  {MENU_CATEGORIES.filter((c) => c !== "Semua Kategori").map((c) => (
                    <option key={c} value={c} className="bg-[#1a1b22] text-white">
                      {c}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          {/* Section 2: Penetapan Harga Jual & Profit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Dine In Card */}
            <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-4 border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-emerald-400" />
                  Harga Dine-In *
                </span>
                <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/15 px-3 py-0.5 rounded-full border border-emerald-500/30">
                  HPP: <strong className="text-white">{formatIDR(liveCalculation.hpp.dineInTotalHPP)}</strong>
                </span>
              </div>
              <Input
                type="number"
                required
                min={0}
                step={500}
                value={formData.sellingPriceDineIn}
                onChange={(e) =>
                  setFormData({ ...formData, sellingPriceDineIn: parseFloat(e.target.value) || 0 })
                }
                className="text-sm font-extrabold text-white bg-white/[0.05] border-white/[0.1] rounded-xl"
                placeholder="25000"
              />
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-slate-400 text-[11px]">Food Cost Dine-In:</span>
                <span className={`font-black text-xs ${getFoodCostColorClass(liveCalculation.dineInFoodCostPct)}`}>
                  {formatNumber(liveCalculation.dineInFoodCostPct, 1)}%
                </span>
              </div>
            </div>

            {/* Online Delivery Card */}
            <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-4 border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-blue-400" />
                  Harga Online Delivery *
                </span>
                <span className="text-[11px] font-bold text-blue-300 bg-blue-500/15 px-3 py-0.5 rounded-full border border-blue-500/30">
                  HPP: <strong className="text-white">{formatIDR(liveCalculation.hpp.onlineTotalHPP)}</strong>
                </span>
              </div>
              <Input
                type="number"
                required
                min={0}
                step={500}
                value={formData.sellingPriceOnline}
                onChange={(e) =>
                  setFormData({ ...formData, sellingPriceOnline: parseFloat(e.target.value) || 0 })
                }
                className="text-sm font-extrabold text-white bg-white/[0.05] border-white/[0.1] rounded-xl"
                placeholder="30000"
              />
              {/* Quick Helper Markup Buttons */}
              <div className="flex items-center justify-between gap-1 text-[11px]">
                <span className="text-slate-400 text-[10px]">Markup Cepat:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        sellingPriceOnline: Math.round((formData.sellingPriceDineIn * 1.2) / 500) * 500,
                      })
                    }
                    className="px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 font-bold border border-white/[0.1] cursor-pointer transition-colors text-[10px]"
                    title="Naikkan 20% untuk komisi GoFood/GrabFood"
                  >
                    +20% Ojol
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        sellingPriceOnline: Math.round((formData.sellingPriceDineIn * 1.25) / 500) * 500,
                      })
                    }
                    className="px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 font-bold border border-white/[0.1] cursor-pointer transition-colors text-[10px]"
                    title="Naikkan 25% untuk margin aman ojol"
                  >
                    +25% Ojol
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        sellingPriceOnline: formData.sellingPriceDineIn,
                      })
                    }
                    className="px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 font-bold border border-white/[0.08] cursor-pointer transition-colors text-[10px]"
                  >
                    Sama
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Komposisi Resep */}
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-4 border border-white/[0.08] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-white/[0.08]">
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-orange-400" />
                  Komposisi Resep &amp; Kemasan
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {recipeItems.length} bahan dimasukkan
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddItemRow("ingredient")}
                  className="text-xs bg-white/[0.06] hover:bg-white/[0.12] text-white border-white/[0.1] rounded-full font-bold px-3 py-1.5"
                >
                  <Plus className="w-3.5 h-3.5 mr-1 text-orange-400" /> + Bahan Mentah
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddItemRow("sub_recipe")}
                  className="text-xs bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30 rounded-full font-bold px-3 py-1.5"
                >
                  <Plus className="w-3.5 h-3.5 mr-1 text-emerald-400" /> + Sub-Recipe Olahan
                </Button>
              </div>
            </div>

            {/* Recipe Items Row List */}
            {recipeItems.length === 0 ? (
              <div className="text-center py-6 bg-white/[0.02] rounded-2xl border border-dashed border-white/[0.1]">
                <p className="text-xs text-slate-400">Belum ada bahan dalam resep ini.</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Klik tombol <strong className="text-white">+ Bahan Mentah</strong> atau <strong className="text-emerald-400">+ Sub-Recipe Olahan</strong> di atas.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {recipeItems.map((item, idx) => {
                  const rowCalc = liveCalculation.costItems[idx];
                  return (
                    <div
                      key={idx}
                      className={`grid grid-cols-1 sm:grid-cols-12 gap-2 items-center p-2.5 rounded-2xl border backdrop-blur-xl transition-colors ${
                        item.channel === "online_only"
                          ? "bg-blue-500/[0.06] border-blue-500/20"
                          : item.itemType === "sub_recipe"
                          ? "bg-emerald-500/[0.06] border-emerald-500/20"
                          : "bg-white/[0.03] border-white/[0.07]"
                      }`}
                    >
                      <div className="sm:col-span-2 flex items-center">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border text-center w-full truncate ${
                          item.itemType === "sub_recipe"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : "bg-white/[0.08] text-slate-300 border-white/[0.1]"
                        }`}>
                          {item.itemType === "sub_recipe" ? "Olahan" : "Bahan"}
                        </span>
                      </div>

                      <div className="sm:col-span-4">
                        {item.itemType === "sub_recipe" ? (
                          <Select
                            value={item.subRecipeId}
                            onChange={(e) => handleItemChange(idx, "subRecipeId", e.target.value)}
                            className="text-xs font-semibold bg-white/[0.04] border-white/[0.1] text-white rounded-xl"
                          >
                            {availableSubRecipes.map((sub) => (
                              <option key={sub.id} value={sub.id} className="bg-[#1a1b22] text-white">
                                {sub.name} ({formatIDR(sub.costPerYieldUnit)}/{sub.batchUnit})
                              </option>
                            ))}
                          </Select>
                        ) : (
                          <Select
                            value={item.ingredientId}
                            onChange={(e) => handleItemChange(idx, "ingredientId", e.target.value)}
                            className="text-xs font-semibold bg-white/[0.04] border-white/[0.1] text-white rounded-xl"
                          >
                            {availableIngredients.map((ing) => (
                              <option key={ing.id} value={ing.id} className="bg-[#1a1b22] text-white">
                                {ing.name} ({ing.category}) - {formatIDR(ing.effectiveUnitCost)}/{ing.defaultRecipeUnit}
                                {ing.isPackaging ? " [Kemasan]" : ""}
                              </option>
                            ))}
                          </Select>
                        )}
                      </div>

                      <div className="sm:col-span-2 flex items-center gap-1.5">
                        <Input
                          type="number"
                          min={0.01}
                          step={0.1}
                          placeholder="Takaran"
                          className="text-right text-xs font-bold bg-white/[0.04] border-white/[0.1] text-white rounded-xl"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(idx, "quantity", parseFloat(e.target.value) || 0)
                          }
                        />
                        <span className="text-[11px] font-bold text-slate-400 shrink-0 w-8">
                          {item.unit}
                        </span>
                      </div>

                      <div className="sm:col-span-2">
                        <Select
                          className="text-xs font-semibold bg-white/[0.04] border-white/[0.1] text-white rounded-xl"
                          value={item.channel}
                          onChange={(e) => handleItemChange(idx, "channel", e.target.value)}
                        >
                          <option value="all" className="bg-[#1a1b22] text-white">Semua Kanal</option>
                          <option value="dine_in_only" className="bg-[#1a1b22] text-white">Dine-In Saja</option>
                          <option value="online_only" className="bg-[#1a1b22] text-white">Khusus Kemasan</option>
                        </Select>
                      </div>

                      <div className="sm:col-span-1 text-right">
                        <div className="font-black text-xs text-white">
                          {formatIDR(rowCalc?.subtotal || 0)}
                        </div>
                      </div>

                      <div className="sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="text-slate-500 hover:text-rose-400 p-2 rounded-xl hover:bg-rose-500/10 cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors"
                          title="Hapus bahan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 4: Ringkasan Total HPP & Rekomendasi */}
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-4 border border-white/[0.08] space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-3 bg-white/[0.03] backdrop-blur-md rounded-2xl border border-white/[0.06]">
                <span className="text-slate-400 text-[11px]">Bahan Bersih:</span>
                <div className="font-black text-white text-sm mt-0.5">
                  {formatIDR(liveCalculation.hpp.dineInBaseHPP)}
                </div>
              </div>
              <div className="p-3 bg-white/[0.03] backdrop-blur-md rounded-2xl border border-white/[0.06]">
                <span className="text-slate-400 text-[11px]">HPP Dine-In:</span>
                <div className="font-black text-white text-sm mt-0.5">
                  {formatIDR(liveCalculation.hpp.dineInTotalHPP)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  FC: <strong className={getFoodCostColorClass(liveCalculation.dineInFoodCostPct)}>{formatNumber(liveCalculation.dineInFoodCostPct, 1)}%</strong>
                </div>
              </div>
              <div className="p-3 bg-white/[0.03] backdrop-blur-md rounded-2xl border border-white/[0.06]">
                <span className="text-slate-400 text-[11px]">Kemasan Delivery:</span>
                <div className="font-black text-blue-400 text-sm mt-0.5">
                  +{formatIDR(liveCalculation.hpp.packagingCost)}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Khusus Online</div>
              </div>
              <div className="p-3 bg-emerald-500/10 backdrop-blur-md rounded-2xl border border-emerald-500/25">
                <span className="text-emerald-400 font-semibold text-[11px]">HPP Online Delivery:</span>
                <div className="font-black text-emerald-300 text-sm mt-0.5">
                  {formatIDR(liveCalculation.hpp.onlineTotalHPP)}
                </div>
                <div className="text-[10px] text-emerald-400 mt-0.5">
                  FC: <strong>{formatNumber(liveCalculation.onlineFoodCostPct, 1)}%</strong>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center gap-2.5 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Rekomendasi Harga Jual (Target {formData.targetFoodCostPercent}% FC): Dine-In{" "}
                <strong className="text-white">{formatIDR(liveCalculation.recDineInPrice)}</strong> • Online{" "}
                <strong className="text-white">{formatIDR(liveCalculation.recOnlinePrice)}</strong>
              </span>
            </div>
          </div>

          {/* Section 5: Collapsible Pengaturan Lanjutan (Waste, Upah Koki, SKU, Target) */}
          <div className="border border-white/[0.08] rounded-2xl overflow-hidden bg-white/[0.02]">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-slate-300 hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-orange-400" />
                Pengaturan Lanjutan (Waste: {formData.wastePercent}%, Tenaga Kerja: {formatIDR(formData.directLaborCost)}, Target FC: {formData.targetFoodCostPercent}%)
              </span>
              {showAdvanced ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showAdvanced && (
              <div className="p-4 border-t border-white/[0.08] bg-white/[0.02] space-y-4 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Toleransi Waste */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-slate-300">
                        Toleransi Waste &amp; Tumpah: {formData.wastePercent}%
                      </Label>
                    </div>
                    <Slider
                      min={0}
                      max={15}
                      step={0.5}
                      value={formData.wastePercent}
                      onChange={(val) => setFormData({ ...formData, wastePercent: val })}
                    />
                    <p className="text-[10px] text-slate-500">
                      Cadangan susut / salah takar saat pembuatan (standar 2% - 5%).
                    </p>
                  </div>

                  {/* Biaya Tenaga Kerja */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-300">Tenaga Kerja per Porsi (Rp)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={200}
                      value={formData.directLaborCost}
                      onChange={(e) =>
                        setFormData({ ...formData, directLaborCost: parseFloat(e.target.value) || 0 })
                      }
                      className="text-xs font-semibold bg-white/[0.04] border-white/[0.1] text-white rounded-xl"
                      placeholder="0"
                    />
                    <p className="text-[10px] text-slate-500">
                      Insentif barista atau koki pembuat menu.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-3 border-t border-white/[0.06]">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-300">Kode SKU / Barcode</Label>
                    <Input
                      placeholder="SKU-COF-01"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="text-xs bg-white/[0.04] border-white/[0.1] text-white rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-300">Estimasi Penjualan Bulanan (Porsi)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.monthlySalesVolume}
                      onChange={(e) =>
                        setFormData({ ...formData, monthlySalesVolume: parseInt(e.target.value) || 1 })
                      }
                      className="text-xs font-semibold bg-white/[0.04] border-white/[0.1] text-white rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-300">Target Food Cost (%)</Label>
                    <Input
                      type="number"
                      min={10}
                      max={90}
                      value={formData.targetFoodCostPercent}
                      onChange={(e) =>
                        setFormData({ ...formData, targetFoodCostPercent: parseFloat(e.target.value) || 30 })
                      }
                      className="text-xs font-semibold bg-white/[0.04] border-white/[0.1] text-white rounded-xl"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 6: Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
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
              {saving ? "Menyimpan..." : editingMenu ? "Simpan Perubahan" : "Simpan Resep Menu"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
