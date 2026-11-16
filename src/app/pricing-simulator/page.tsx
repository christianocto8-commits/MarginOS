"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useOutlet } from "@/context/OutletContext";
import {
  formatIDR,
  formatNumber,
  simulateOnlineFoodDelivery,
  getFoodCostColorClass,
} from "@/lib/costing-engine";
import {
  Smartphone,
  Store,
  AlertTriangle,
  Sliders,
  CheckCircle2,
  UtensilsCrossed,
  Calculator,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

export default function PricingSimulatorPage() {
  const { currentOutlet } = useOutlet();
  const [menus, setMenus] = useState<any[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState<string>("custom");

  // Simulator Inputs
  const [baseCostDineIn, setBaseCostDineIn] = useState<number>(7500);
  const [packagingCost, setPackagingCost] = useState<number>(1800);
  const [dineInPrice, setDineInPrice] = useState<number>(25000);
  const [onlinePrice, setOnlinePrice] = useState<number>(31500);

  // Platform Commission & Fee Controls
  const [platformCommissionPercent, setPlatformCommissionPercent] = useState<number>(20.0);
  const [platformFlatFee, setPlatformFlatFee] = useState<number>(1000.0);
  const [merchantPromoPercent, setMerchantPromoPercent] = useState<number>(5.0);

  const applyPreset = (preset: "gofood" | "grabfood" | "shopeefood") => {
    if (preset === "gofood") {
      setPlatformCommissionPercent(20.0);
      setPlatformFlatFee(1000.0);
      setMerchantPromoPercent(0.0);
    } else if (preset === "grabfood") {
      setPlatformCommissionPercent(20.0);
      setPlatformFlatFee(1000.0);
      setMerchantPromoPercent(5.0);
    } else if (preset === "shopeefood") {
      setPlatformCommissionPercent(20.0);
      setPlatformFlatFee(1000.0);
      setMerchantPromoPercent(10.0);
    }
  };

  useEffect(() => {
    if (!currentOutlet) return;
    fetch(`/api/menus?outletId=${currentOutlet.id}`)
      .then((res) => res.json())
      .then((data) => {
        const m = data.menus || [];
        setMenus(m);
        if (m.length > 0) {
          setSelectedMenuId(m[0].id);
          setBaseCostDineIn(m[0].dineIn?.totalHPP || 7500);
          setPackagingCost(m[0].onlineDelivery?.packagingCost || 1800);
          setDineInPrice(m[0].sellingPriceDineIn || 25000);
          setOnlinePrice(m[0].sellingPriceOnline || 31500);
        }
      })
      .catch((err) => console.error(err));
  }, [currentOutlet]);

  const handleMenuChange = (menuId: string) => {
    setSelectedMenuId(menuId);
    if (menuId === "custom") return;

    const m = menus.find((item) => item.id === menuId);
    if (m) {
      setBaseCostDineIn(m.dineIn?.totalHPP || 0);
      setPackagingCost(m.onlineDelivery?.packagingCost || 0);
      setDineInPrice(m.sellingPriceDineIn || 0);
      setOnlinePrice(m.sellingPriceOnline || 0);
    }
  };

  const simulation = useMemo(() => {
    const totalOnlineHPP = baseCostDineIn + packagingCost;

    const dineInGrossProfit = dineInPrice - baseCostDineIn;
    const dineInGrossMarginPct = dineInPrice > 0 ? (dineInGrossProfit / dineInPrice) * 100 : 0;
    const dineInFoodCostPct = dineInPrice > 0 ? (baseCostDineIn / dineInPrice) * 100 : 0;

    const ofd = simulateOnlineFoodDelivery(
      onlinePrice,
      totalOnlineHPP,
      platformCommissionPercent,
      platformFlatFee,
      merchantPromoPercent
    );

    const effectiveRetentionRate = 1 - (platformCommissionPercent + merchantPromoPercent) / 100;
    const recommendedMarkupPrice =
      effectiveRetentionRate > 0
        ? Math.ceil((dineInGrossProfit + totalOnlineHPP + platformFlatFee) / effectiveRetentionRate / 500) * 500
        : onlinePrice;

    const markupPct = dineInPrice > 0 ? ((onlinePrice - dineInPrice) / dineInPrice) * 100 : 0;

    return {
      totalOnlineHPP,
      dineInGrossProfit,
      dineInGrossMarginPct,
      dineInFoodCostPct,
      ofd,
      recommendedMarkupPrice,
      markupPct,
    };
  }, [
    baseCostDineIn,
    packagingCost,
    dineInPrice,
    onlinePrice,
    platformCommissionPercent,
    platformFlatFee,
    merchantPromoPercent,
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.25)]">
              <Smartphone className="w-4 h-4" />
            </div>
            Simulator Harga Multi-Channel &amp; Online Delivery
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Simulasi komisi aplikasi (GoFood, GrabFood, ShopeeFood) dan beban promo merchant agar restoran tidak tekor.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyPreset("gofood")}
            className="text-xs bg-rose-500/15 text-rose-300 border-rose-500/30 rounded-full font-bold px-3 py-1.5 hover:bg-rose-500/25"
          >
            GoFood (20% + 1rb)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyPreset("grabfood")}
            className="text-xs bg-emerald-500/15 text-emerald-300 border-emerald-500/30 rounded-full font-bold px-3 py-1.5 hover:bg-emerald-500/25"
          >
            GrabFood (20% + 5% Promo)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyPreset("shopeefood")}
            className="text-xs bg-orange-500/15 text-orange-300 border-orange-500/30 rounded-full font-bold px-3 py-1.5 hover:bg-orange-500/25"
          >
            ShopeeFood (20% + 10% Promo)
          </Button>
        </div>
      </div>

      {/* Sub Navigation Bar - Tab Switcher */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-[#19191b] border border-white/[0.08] rounded-lg w-fit">
        <Link
          href="/menus"
          className="px-3 py-1.5 rounded-md text-xs font-medium text-[#85858b] hover:text-[#ededed] hover:bg-white/[0.04] transition-colors flex items-center gap-2"
        >
          <UtensilsCrossed className="w-3.5 h-3.5 text-[#85858b]" />
          Katalog &amp; Resep HPP
        </Link>
        <span className="px-3 py-1.5 rounded-md text-xs font-medium bg-[#232325] text-[#ededed] border border-white/[0.08] flex items-center gap-2">
          <Calculator className="w-3.5 h-3.5 text-amber-400" />
          Simulator Komisi Ojol (GoFood / Grab)
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Input Controls (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#181920]/80 backdrop-blur-2xl rounded-3xl border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold text-white flex items-center justify-between">
                <span>Pilih Menu &amp; Biaya</span>
                <Sliders className="w-4 h-4 text-slate-400" />
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Pilih menu dari database atau atur angka simulasi secara manual.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Pilih Menu</Label>
                <Select
                  value={selectedMenuId}
                  onChange={(e) => handleMenuChange(e.target.value)}
                  className="text-xs"
                >
                  <option value="custom">Simulasi Manual (Kustom)</option>
                  {menus.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({formatIDR(m.sellingPriceDineIn)})
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label className="text-xs">HPP Resep Dine-In (Rp)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={500}
                    value={baseCostDineIn}
                    onChange={(e) => setBaseCostDineIn(parseFloat(e.target.value) || 0)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Biaya Kemasan Online (Rp)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={200}
                    value={packagingCost}
                    onChange={(e) => setPackagingCost(parseFloat(e.target.value) || 0)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label className="text-xs">Harga Jual Dine-In (Rp)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={1000}
                    value={dineInPrice}
                    onChange={(e) => setDineInPrice(parseFloat(e.target.value) || 0)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Harga Jual Online (Rp)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={1000}
                    value={onlinePrice}
                    onChange={(e) => setOnlinePrice(parseFloat(e.target.value) || 0)}
                    className="text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </div>

          {/* Skema Potongan Aplikasi */}
          <div className="bg-[#181920]/80 backdrop-blur-2xl rounded-3xl border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold text-white">
                Skema Potongan Aplikasi Online
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-3.5">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <Label className="text-xs">Komisi Platform (%):</Label>
                  <span className="font-bold text-white">{platformCommissionPercent}%</span>
                </div>
                <Slider
                  min={10}
                  max={35}
                  step={0.5}
                  value={platformCommissionPercent}
                  onChange={(v) => setPlatformCommissionPercent(v)}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Biaya Layanan Flat per Transaksi (Rp)</Label>
                <Input
                  type="number"
                  min={0}
                  step={500}
                  value={platformFlatFee}
                  onChange={(e) => setPlatformFlatFee(parseFloat(e.target.value) || 0)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <Label className="text-xs">Subsidi Promo Merchant (%):</Label>
                  <span className="font-bold text-rose-400">{merchantPromoPercent}%</span>
                </div>
                <Slider
                  min={0}
                  max={30}
                  step={1}
                  value={merchantPromoPercent}
                  onChange={(v) => setMerchantPromoPercent(v)}
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  onClick={() => setOnlinePrice(simulation.recommendedMarkupPrice)}
                  variant="outline"
                  className="w-full text-xs text-emerald-400 border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100"
                >
                  Terapkan Rekomendasi Markup ({formatIDR(simulation.recommendedMarkupPrice)})
                </Button>
              </div>
            </CardContent>
          </div>
        </div>

        {/* Right: Results Comparison & Waterfall (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Dine In Card */}
            <div className="bg-[#181920]/80 backdrop-blur-2xl rounded-3xl border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <Store className="w-4 h-4 text-slate-400" />
                    Penjualan Dine-In
                  </span>
                  <span className="text-[10px] font-semibold text-zinc-300 bg-white/[0.08] px-2 py-0.5 rounded-md border border-white/[0.1]">
                    Meja
                  </span>
                </div>
                <div className="text-xl font-bold mt-1 text-white">
                  {formatIDR(dineInPrice)}
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-2 text-xs">
                <div className="flex justify-between text-zinc-300">
                  <span>HPP Resep:</span>
                  <span className="font-semibold text-white">-{formatIDR(baseCostDineIn)}</span>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span>Food Cost:</span>
                  <span className={`font-semibold ${getFoodCostColorClass(simulation.dineInFoodCostPct)}`}>
                    {formatNumber(simulation.dineInFoodCostPct, 1)}%
                  </span>
                </div>
                <div className="pt-2 border-t border-white/[0.08] flex justify-between items-baseline">
                  <span className="font-semibold text-zinc-200">Laba Bersih:</span>
                  <span className="text-base font-extrabold text-emerald-400">
                    {formatIDR(simulation.dineInGrossProfit)}
                  </span>
                </div>
                <div className="text-right text-[11px] text-zinc-400">
                  Margin {formatNumber(simulation.dineInGrossMarginPct, 1)}%
                </div>
              </CardContent>
            </div>

            {/* Online Delivery Card */}
            <div className="bg-[#181920]/80 backdrop-blur-2xl rounded-3xl border border-emerald-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    Online Delivery
                  </span>
                  <span className="text-[10px] font-bold text-emerald-900 bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-500/30 backdrop-blur-xs">
                    +{formatNumber(simulation.markupPct, 1)}% Markup
                  </span>
                </div>
                <div className="text-xl font-bold mt-1 text-white">
                  {formatIDR(onlinePrice)}
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Potongan Aplikasi:</span>
                  <span className="font-semibold text-rose-400">
                    -{formatIDR(simulation.ofd.commissionAmount + simulation.ofd.merchantPromoAmount + simulation.ofd.flatFeeAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>HPP Resep + Kemasan:</span>
                  <span className="font-semibold text-white">
                    -{formatIDR(simulation.totalOnlineHPP)}
                  </span>
                </div>
                <div className="pt-2 border-t border-emerald-500/30 flex justify-between items-baseline">
                  <span className="font-semibold text-slate-200">Laba Bersih:</span>
                  <span className="text-base font-extrabold text-emerald-400">
                    {formatIDR(simulation.ofd.netProfit)}
                  </span>
                </div>
                <div className="text-right text-[11px] text-slate-400">
                  Net Margin {formatNumber(simulation.ofd.netMarginPercent, 1)}%
                </div>
              </CardContent>
            </div>
          </div>

          {/* Status Box */}
          <div className="bg-[#181920]/80 backdrop-blur-2xl rounded-3xl border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
            <CardContent className="p-4 space-y-3 text-xs">
              {simulation.ofd.netProfit >= simulation.dineInGrossProfit ? (
                <div className="p-3.5 bg-emerald-500/10 backdrop-blur-md border border-emerald-500/25 rounded-2xl flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-emerald-900 block">
                      Harga Online Aman (+{formatIDR(simulation.ofd.netProfit - simulation.dineInGrossProfit)} per porsi dibanding Dine-In)
                    </span>
                    <span className="text-emerald-400 text-[11px] mt-0.5 block">
                      Harga jual {formatIDR(onlinePrice)} sudah cukup menutup komisi {platformCommissionPercent}%, biaya flat, dan biaya kemasan.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-rose-500/10 backdrop-blur-md border border-rose-500/25 rounded-2xl flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-rose-200 block">
                      Perhatian: Laba Online Tergerus Rp {formatIDR(simulation.dineInGrossProfit - simulation.ofd.netProfit)} dibanding Dine-In
                    </span>
                    <span className="text-rose-300 text-[11px] mt-0.5 block">
                      Disarankan menaikkan harga jual online menjadi minimal <strong>{formatIDR(simulation.recommendedMarkupPrice)}</strong>.
                    </span>
                  </div>
                </div>
              )}

              {/* Rincian Aliran Kas */}
              <div className="space-y-1 pt-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Rincian 1 Transaksi Online ({formatIDR(onlinePrice)})
                </span>
                <div className="border border-white/[0.08] rounded-xl divide-y divide-white/[0.06] bg-[#1a1a1d] text-xs overflow-hidden">
                  <div className="p-2.5 flex justify-between">
                    <span className="text-zinc-300 font-medium">1. Harga Dibayar Pelanggan</span>
                    <span className="font-bold text-white">{formatIDR(onlinePrice)}</span>
                  </div>
                  <div className="p-2.5 flex justify-between text-rose-400">
                    <span>2. Komisi Aplikasi ({platformCommissionPercent}%)</span>
                    <span className="font-semibold">-{formatIDR(simulation.ofd.commissionAmount)}</span>
                  </div>
                  <div className="p-2.5 flex justify-between text-rose-400">
                    <span>3. Biaya Layanan Transaksi Flat</span>
                    <span className="font-semibold">-{formatIDR(simulation.ofd.flatFeeAmount)}</span>
                  </div>
                  {simulation.ofd.merchantPromoAmount > 0 && (
                    <div className="p-2.5 flex justify-between text-rose-400">
                      <span>4. Subsidi Promo Merchant ({merchantPromoPercent}%)</span>
                      <span className="font-semibold">-{formatIDR(simulation.ofd.merchantPromoAmount)}</span>
                    </div>
                  )}
                  <div className="p-2.5 flex justify-between bg-white/[0.04] font-bold text-zinc-100">
                    <span>5. Payout Masuk Rekening Resto</span>
                    <span className="text-amber-400">{formatIDR(simulation.ofd.netPayoutToRestaurant)}</span>
                  </div>
                  <div className="p-2.5 flex justify-between">
                    <span className="text-zinc-300">6. Modal Bahan Baku Makanan</span>
                    <span className="font-medium text-zinc-200">-{formatIDR(baseCostDineIn)}</span>
                  </div>
                  <div className="p-2.5 flex justify-between">
                    <span className="text-zinc-300">7. Modal Kemasan &amp; Kantong</span>
                    <span className="font-medium text-zinc-200">-{formatIDR(packagingCost)}</span>
                  </div>
                  <div className="p-3 flex justify-between bg-emerald-500/10 text-emerald-300 font-bold border-t border-emerald-500/20">
                    <span className="text-emerald-300">8. Untung Bersih Resto (Net Profit)</span>
                    <span className="font-extrabold text-emerald-400 text-sm">{formatIDR(simulation.ofd.netProfit)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </div>
        </div>
      </div>
    </div>
  );
}
