"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useOutlet } from "@/context/OutletContext";
import { formatIDR, formatNumber } from "@/lib/costing-engine";
import {
  Zap,
  Store,
  ShoppingBag,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

interface QuickItem {
  id: string;
  name: string;
  cost: number;
  quantity: number;
  unit: string;
  isPackaging: boolean;
}

export default function QuickCalcPage() {
  const { currentOutlet } = useOutlet();
  const [availableIngredients, setAvailableIngredients] = useState<any[]>([]);
  const [loadingIngredients, setLoadingIngredients] = useState(false);

  // Simple Form State
  const [menuName, setMenuName] = useState("");
  const [category, setCategory] = useState("Makanan Ringan / Snack");
  const [sellingPriceDineIn, setSellingPriceDineIn] = useState<number>(20000);
  const [sellingPriceOnline, setSellingPriceOnline] = useState<number>(25000);
  const [isOnlineAuto, setIsOnlineAuto] = useState(true);

  // Items in this quick recipe
  const [items, setItems] = useState<QuickItem[]>([
    {
      id: "1",
      name: "Bahan Utama (misal: Ayam / Kopi / Daging)",
      cost: 4500,
      quantity: 1,
      unit: "porsi",
      isPackaging: false,
    },
    {
      id: "2",
      name: "Bumbu & Pelengkap (misal: Saus / Susu / Minyak)",
      cost: 2000,
      quantity: 1,
      unit: "porsi",
      isPackaging: false,
    },
    {
      id: "3",
      name: "Kemasan / Cup / Box (Khusus Bungkus)",
      cost: 1500,
      quantity: 1,
      unit: "pcs",
      isPackaging: true,
    },
  ]);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load ingredients from outlet
  useEffect(() => {
    if (!currentOutlet) return;
    async function loadIng() {
      try {
        setLoadingIngredients(true);
        const res = await fetch(`/api/ingredients?outletId=${currentOutlet?.id}`);
        if (res.ok) {
          const data = await res.json();
          setAvailableIngredients(data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingIngredients(false);
      }
    }
    loadIng();
  }, [currentOutlet]);

  // Calculations
  const calculations = useMemo(() => {
    // Total modal bahan bersih (tanpa kemasan)
    const foodCostOnly = items
      .filter((it) => !it.isPackaging)
      .reduce((sum, it) => sum + it.cost * it.quantity, 0);

    // Total kemasan khusus online / takeaway
    const packagingCost = items
      .filter((it) => it.isPackaging)
      .reduce((sum, it) => sum + it.cost * it.quantity, 0);

    // Total modal Dine-In
    const hppDineIn = foodCostOnly;

    // Total modal Online (Bahan + Kemasan)
    const hppOnline = foodCostOnly + packagingCost;

    // Rekomendasi Harga Jual Dine-In (Food cost sehat 30%)
    const recDineIn = Math.round((hppDineIn / 0.3) / 1000) * 1000 || 15000;

    // Rekomendasi Harga Jual Ojol (Cover 20% komisi + 1rb flat fee + 30% target food cost)
    // Formula: (hppOnline / 0.3 + 1000) / 0.8
    const recOnline = Math.round(((recDineIn + packagingCost + 1000) / 0.8) / 500) * 500 || 20000;

    // Untung Bersih Dine-In
    const dineInPrice = sellingPriceDineIn || 0;
    const profitDineIn = dineInPrice - hppDineIn;
    const marginDineInPct = dineInPrice > 0 ? (profitDineIn / dineInPrice) * 100 : 0;
    const foodCostDineInPct = dineInPrice > 0 ? (hppDineIn / dineInPrice) * 100 : 0;

    // Online delivery math (asumsi GoFood/GrabFood potong 20% + Rp 1.000)
    const onlinePrice = sellingPriceOnline || 0;
    const commissionFee = onlinePrice * 0.2 + 1000;
    const moneyReceived = Math.max(0, onlinePrice - commissionFee);
    const profitOnline = moneyReceived - hppOnline;
    const marginOnlinePct = onlinePrice > 0 ? (profitOnline / onlinePrice) * 100 : 0;
    const foodCostOnlinePct = onlinePrice > 0 ? (hppOnline / onlinePrice) * 100 : 0;

    return {
      foodCostOnly,
      packagingCost,
      hppDineIn,
      hppOnline,
      recDineIn,
      recOnline,
      profitDineIn,
      marginDineInPct,
      foodCostDineInPct,
      commissionFee,
      moneyReceived,
      profitOnline,
      marginOnlinePct,
      foodCostOnlinePct,
    };
  }, [items, sellingPriceDineIn, sellingPriceOnline]);

  // Sync automatic online price suggestion when dine-in changes
  useEffect(() => {
    if (isOnlineAuto && calculations.recOnline > 0) {
      setSellingPriceOnline(calculations.recOnline);
    }
  }, [calculations.recOnline, isOnlineAuto]);

  const handleAddItem = (isPkg = false) => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        name: isPkg ? "Kemasan Baru (Plastik / Box)" : "Bahan Tambahan",
        cost: isPkg ? 1000 : 1500,
        quantity: 1,
        unit: isPkg ? "pcs" : "porsi",
        isPackaging: isPkg,
      },
    ]);
  };

  const handleAddFromSaved = (ing: any) => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        name: ing.name,
        cost: ing.effectiveUnitCost || 1000,
        quantity: 1,
        unit: ing.defaultRecipeUnit || "porsi",
        isPackaging: Boolean(ing.isPackaging),
      },
    ]);
  };

  const handleUpdateItem = (id: string, field: string, val: any) => {
    setItems(
      items.map((it) => (it.id === id ? { ...it, [field]: val } : it))
    );
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((it) => it.id !== id));
  };

  const handleReset = () => {
    setMenuName("");
    setSellingPriceDineIn(20000);
    setSellingPriceOnline(25000);
    setIsOnlineAuto(true);
    setSaveSuccess(false);
    setItems([
      {
        id: "1",
        name: "Bahan Utama",
        cost: 4500,
        quantity: 1,
        unit: "porsi",
        isPackaging: false,
      },
      {
        id: "2",
        name: "Bumbu & Pelengkap",
        cost: 2000,
        quantity: 1,
        unit: "porsi",
        isPackaging: false,
      },
    ]);
  };

  const handleSaveToCatalog = async () => {
    if (!currentOutlet) return;
    if (!menuName.trim()) {
      alert("Silakan ketik nama menu terlebih dahulu.");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/menus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outletId: currentOutlet.id,
          name: menuName.trim(),
          category,
          sellingPriceDineIn,
          sellingPriceOnline,
          monthlySalesVolume: 100,
          wastePercent: 3.0,
          directLaborCost: 0,
          targetFoodCostPercent: 30.0,
          recipeItems: [], // Saved quick menu
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
      } else {
        alert("Gagal menyimpan menu.");
      }
    } catch {
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Header Badge */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.25)]">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Kalkulator Kilat Modal &amp; Harga Jual
            </h1>
            <p className="text-xs text-slate-400">
              Khusus pemula: hitung modal 1 porsi &amp; cek keuntungan ojol dalam 1 menit.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="text-slate-400 hover:text-white p-2.5 rounded-full hover:bg-white/[0.06] text-xs font-bold flex items-center gap-1.5 transition-colors border border-white/[0.08]"
          title="Ulangi dari awal"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* LANGKAH 1: NAMA MENU */}
      <div className="bg-[#181920]/80 backdrop-blur-2xl rounded-3xl border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-5 space-y-3.5">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-full bg-orange-500 text-slate-950 text-xs font-black flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(249,115,22,0.5)]">
            1
          </span>
          <span className="text-xs font-black text-white uppercase tracking-wider">
            Apa Menu yang Mau Dihitung?
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8">
            <Input
              placeholder="Misal: Es Kopi Susu, Nasi Ayam Geprek, Roti Bakar..."
              value={menuName}
              onChange={(e) => setMenuName(e.target.value)}
              className="text-sm font-bold h-12 bg-white/[0.04] border-white/[0.1] text-white placeholder:text-slate-500 rounded-2xl"
            />
          </div>
          <div className="sm:col-span-4">
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="text-xs font-semibold h-12 bg-white/[0.04] border-white/[0.1] text-white rounded-2xl"
            >
              <option value="Minuman" className="bg-[#1a1b22] text-white">Minuman (Kopi/Teh)</option>
              <option value="Makanan Utama" className="bg-[#1a1b22] text-white">Makanan Utama</option>
              <option value="Makanan Ringan / Snack" className="bg-[#1a1b22] text-white">Snack &amp; Cemilan</option>
              <option value="Pastry & Bakery" className="bg-[#1a1b22] text-white">Roti &amp; Bakery</option>
              <option value="Paket Katering" className="bg-[#1a1b22] text-white">Paket Katering</option>
            </Select>
          </div>
        </div>
      </div>

      {/* LANGKAH 2: BAHAN-BAHAN PEMBUAT */}
      <div className="bg-[#181920]/80 backdrop-blur-2xl rounded-3xl border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-orange-500 text-slate-950 text-xs font-black flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(249,115,22,0.5)]">
              2
            </span>
            <div>
              <span className="text-xs font-black text-white uppercase tracking-wider block">
                Bahan Pembuat 1 Porsi
              </span>
              <span className="text-[11px] text-slate-400">
                Tulis biaya kira-kira per porsinya
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => handleAddItem(false)}
              className="bg-white hover:bg-slate-200 text-slate-950 text-xs font-black h-9 px-3.5 rounded-full shadow-md"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Bahan
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAddItem(true)}
              className="bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border-blue-500/30 text-xs font-bold h-9 px-3.5 rounded-full"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Kemasan
            </Button>
          </div>
        </div>

        {/* Quick Item List */}
        <div className="space-y-2.5">
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 rounded-2xl border backdrop-blur-xl transition-all ${
                item.isPackaging
                  ? "bg-blue-500/[0.06] border-blue-500/20"
                  : "bg-white/[0.03] border-white/[0.08]"
              }`}
            >
              <div className="flex-1 flex items-center gap-2.5">
                <span
                  className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shrink-0 border ${
                    item.isPackaging
                      ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                      : "bg-white/[0.08] text-slate-300 border-white/[0.1]"
                  }`}
                >
                  {item.isPackaging ? "Kemasan" : "Bahan"}
                </span>
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => handleUpdateItem(item.id, "name", e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-white focus:outline-none placeholder:text-slate-500"
                  placeholder="Nama bahan..."
                />
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-semibold">Biaya: Rp</span>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={item.cost}
                    onChange={(e) =>
                      handleUpdateItem(item.id, "cost", parseFloat(e.target.value) || 0)
                    }
                    className="w-24 text-right bg-white/[0.05] px-2.5 py-1.5 rounded-xl border border-white/[0.1] text-xs font-black text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  className="p-2 text-slate-500 hover:text-rose-400 rounded-xl hover:bg-rose-500/10 cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors"
                  title="Hapus"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

          {/* Quick Autocomplete Chips from Master Data (if available) */}
        {availableIngredients.length > 0 && (
          <div className="pt-2 border-t border-white/[0.06]">
            <span className="text-[11px] text-slate-400 block mb-2">
              Atau pilih cepat dari stok bahan outlet:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {availableIngredients.slice(0, 6).map((ing) => (
                <button
                  key={ing.id}
                  type="button"
                  onClick={() => handleAddFromSaved(ing)}
                  className="text-[11px] font-semibold px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-orange-400" />
                  {ing.name} ({formatIDR(ing.effectiveUnitCost)}/{ing.defaultRecipeUnit})
                </button>
              ))}
            </div>
          </div>
        )}

{/* Subtotal Modal Bahan */}
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-300 font-bold block">
                Total Modal Bahan Mentah (HPP)
              </span>
              <span className="text-[10px] text-slate-500">
                Belum termasuk kemasan bungkus
              </span>
            </div>
            <span className="text-xl font-black text-emerald-400">
              {formatIDR(calculations.hppDineIn)}
            </span>
          </div>
        </div>

      {/* LANGKAH 3: SIMULASI HARGA JUAL & CUAN (DINE-IN VS OJOL) */}
      <div className="bg-[#181920]/80 backdrop-blur-2xl rounded-3xl border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-full bg-orange-500 text-slate-950 text-xs font-black flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(249,115,22,0.5)]">
            3
          </span>
          <div>
            <span className="text-xs font-black text-white uppercase tracking-wider block">
              Tentukan Harga Jual &amp; Cek Untungmu
            </span>
            <span className="text-[11px] text-slate-400">
              Lihat perbandingan cuan makan di meja vs jualan di aplikasi online
            </span>
          </div>
        </div>

        {/* DINE-IN CARD */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Store className="w-4 h-4 text-emerald-400" />
              1. Jual Makan di Tempat (Dine-In)
            </span>
            <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/15 px-3 py-0.5 rounded-full border border-emerald-500/30">
              Saran: {formatIDR(calculations.recDineIn)}
            </span>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-200 font-semibold">Mau dijual berapa per porsi?</Label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                Rp
              </span>
              <Input
                type="number"
                step={1000}
                value={sellingPriceDineIn}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setSellingPriceDineIn(val);
                  if (isOnlineAuto) {
                    setSellingPriceOnline(Math.round(((val * 1.25) + 1500) / 500) * 500);
                  }
                }}
                className="pl-10 text-base font-black text-white h-12 bg-white/[0.04] border-white/[0.1] rounded-2xl"
              />
            </div>
          </div>

          {/* Profit Result Box */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
            <div>
              <span className="text-slate-300 text-xs block font-semibold">Untung Bersih (Cuan):</span>
              <span className="text-xs text-slate-400">
                Persentase Modal: <strong className="text-white">{formatNumber(calculations.foodCostDineInPct, 1)}%</strong>
              </span>
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-emerald-400 block">
                +{formatIDR(calculations.profitDineIn)}
              </span>
              <span className="text-xs font-bold text-emerald-400">
                Margin {formatNumber(calculations.marginDineInPct, 1)}%
              </span>
            </div>
          </div>
        </div>

        {/* ONLINE OJOL CARD */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-blue-400" />
              2. Jual di Ojol (GoFood / Grab / ShopeeFood)
            </span>
            <span className="text-[11px] font-bold text-blue-300 bg-blue-500/15 px-3 py-0.5 rounded-full border border-blue-500/30">
              Saran Aman: {formatIDR(calculations.recOnline)}
            </span>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed bg-white/[0.02] p-3 rounded-2xl border border-white/[0.06]">
            💡 <strong className="text-white">Kenapa harus dinaikkan?</strong> Karena aplikasi ojol memotong sekitar <strong className="text-orange-400">20% komisi + Rp 1.000</strong> per porsi. Ditambah ada biaya kemasan (+{formatIDR(calculations.packagingCost)}).
          </p>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-zinc-200 font-semibold">Harga Jual di Aplikasi Ojol:</Label>
              <button
                type="button"
                onClick={() => {
                  setIsOnlineAuto(false);
                  setSellingPriceOnline(calculations.recOnline);
                }}
                className="text-[11px] text-amber-400 font-bold hover:underline cursor-pointer"
              >
                Pakai Saran Aman ({formatIDR(calculations.recOnline)})
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                Rp
              </span>
              <Input
                type="number"
                step={500}
                value={sellingPriceOnline}
                onChange={(e) => {
                  setIsOnlineAuto(false);
                  setSellingPriceOnline(parseFloat(e.target.value) || 0);
                }}
                className="pl-10 text-base font-black text-white h-12 bg-white/[0.04] border-white/[0.1] rounded-2xl"
              />
            </div>
          </div>

          {/* Online Breakdown Box */}
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>Dipotong Komisi Ojol (20% + 1rb):</span>
              <span className="font-bold text-rose-400">-{formatIDR(calculations.commissionFee)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Uang yang Masuk ke Kamu:</span>
              <span className="font-bold text-white">{formatIDR(calculations.moneyReceived)}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
              <div>
                <span className="font-bold text-white block">Untung Bersih Ojol:</span>
                <span className="text-[11px] text-slate-400">Setelah modal bahan &amp; kemasan</span>
              </div>
              <div className="text-right">
                <span className={`text-lg font-black ${calculations.profitOnline > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {calculations.profitOnline > 0 ? "+" : ""}{formatIDR(calculations.profitOnline)}
                </span>
                <div className="text-[11px] font-bold text-slate-400">
                  Margin {formatNumber(calculations.marginOnlinePct, 1)}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <Button
            type="button"
            onClick={handleSaveToCatalog}
            disabled={saving || !menuName.trim()}
            variant="pill"
            className="w-full h-12 shadow-[0_4px_20px_rgba(255,255,255,0.2)] text-xs font-black flex items-center justify-center gap-2 cursor-pointer"
          >
            {saving ? (
              "Menyimpan ke Menu..."
            ) : saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Berhasil Disimpan ke Katalog Menu!
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-orange-500" />
                Simpan Menu Ini ke Katalog Saya
              </>
            )}
          </Button>
          <Link
            href="/menus"
            className="w-full sm:w-auto px-5 py-3 text-center rounded-full border border-white/[0.15] bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 font-bold text-xs h-12 flex items-center justify-center shrink-0 transition-colors"
          >
            Lihat Semua Resep
          </Link>
        </div>
      </div>
    </div>
  );
}
