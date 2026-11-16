"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useOutlet } from "@/context/OutletContext";
import {
  formatIDR,
  formatNumber,
  calculateBreakEvenPoint,
} from "@/lib/costing-engine";
import {
  TrendingUp,
  Star,
  Zap,
  HelpCircle,
  AlertOctagon,
  Calculator,
  Activity,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";

const QUADRANT_COLORS = {
  Star: "#059669", // emerald
  Plowhorse: "#2563eb", // blue
  Puzzle: "#d97706", // amber
  Dog: "#dc2626", // rose
};

export default function MenuEngineeringPage() {
  const { currentOutlet } = useOutlet();
  const [data, setData] = useState<any>(null);

  // BEP Interactive Fixed Costs
  const [rentCost, setRentCost] = useState(8000000);
  const [salariesCost, setSalariesCost] = useState(12000000);
  const [utilitiesCost, setUtilitiesCost] = useState(3500000);
  const [otherOverhead, setOtherOverhead] = useState(1500000);

  const totalFixedCost = rentCost + salariesCost + utilitiesCost + otherOverhead;

  const fetchData = useCallback(async () => {
    if (!currentOutlet) return;
    try {
      const res = await fetch(`/api/menus?outletId=${currentOutlet.id}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Gagal memuat matriks menu:", err);
    }
  }, [currentOutlet]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const menus = useMemo(() => data?.menus || [], [data]);
  const averages = useMemo(() => data?.averages || { avgVolume: 100, avgMargin: 15000, totalVolume: 0 }, [data]);

  const scatterPoints = useMemo(() => {
    return menus.map((m: any) => ({
      id: m.id,
      name: m.name,
      volume: m.monthlySalesVolume,
      margin: m.dineIn?.grossProfit || 0,
      sellingPrice: m.sellingPriceDineIn,
      foodCostPct: m.dineIn?.foodCostPercent || 0,
      quadrant: m.matrix?.quadrant || "Dog",
      action: m.matrix?.action || "",
    }));
  }, [menus]);

  const groupedMenus = useMemo(() => {
    const stars = menus.filter((m: any) => m.matrix?.quadrant === "Star");
    const plowhorses = menus.filter((m: any) => m.matrix?.quadrant === "Plowhorse");
    const puzzles = menus.filter((m: any) => m.matrix?.quadrant === "Puzzle");
    const dogs = menus.filter((m: any) => m.matrix?.quadrant === "Dog");
    return { stars, plowhorses, puzzles, dogs };
  }, [menus]);

  const bepResult = useMemo(() => {
    if (menus.length === 0) {
      return {
        bepUnits: 0,
        bepRevenue: 0,
        contributionMargin: 0,
        contributionMarginRatio: 0,
        weightedAvgPrice: 0,
        weightedAvgMargin: 0,
        totalVolume: 0,
        bepDailyUnits: 0,
      };
    }

    let totalRevenue = 0;
    let totalMargin = 0;
    let totalVolume = 0;

    menus.forEach((m: any) => {
      const vol = m.monthlySalesVolume || 1;
      totalVolume += vol;
      totalRevenue += (m.sellingPriceDineIn || 0) * vol;
      totalMargin += (m.dineIn?.grossProfit || 0) * vol;
    });

    const weightedAvgPrice = totalVolume > 0 ? totalRevenue / totalVolume : 25000;
    const weightedAvgMargin = totalVolume > 0 ? totalMargin / totalVolume : 15000;
    const weightedAvgHPP = weightedAvgPrice - weightedAvgMargin;

    const bep = calculateBreakEvenPoint(totalFixedCost, weightedAvgPrice, weightedAvgHPP);
    const bepDailyUnits = Math.ceil(bep.bepUnits / 30);

    return {
      ...bep,
      weightedAvgPrice,
      weightedAvgMargin,
      totalVolume,
      bepDailyUnits,
    };
  }, [menus, totalFixedCost]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.25)]">
              <TrendingUp className="w-4 h-4" />
            </div>
            Menu Engineering Matrix &amp; Titik Impas (BEP)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Petakan menu ke 4 kuadran (Stars, Plowhorses, Puzzles, Dogs) berdasarkan Margin vs Volume, serta hitung titik impas operasional bulanan Anda.
          </p>
        </div>
      </div>

      {/* Sub Navigation Bar - Tab Switcher */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-[#19191b] border border-white/[0.08] rounded-lg w-fit">
        <span className="px-3 py-1.5 rounded-md text-xs font-medium bg-[#232325] text-[#ededed] border border-white/[0.08] flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
          Matriks Performa &amp; BEP
        </span>
        <Link
          href="/sop-export"
          className="px-3 py-1.5 rounded-md text-xs font-medium text-[#85858b] hover:text-[#ededed] hover:bg-white/[0.04] transition-colors flex items-center gap-2"
        >
          <FileText className="w-3.5 h-3.5 text-[#85858b]" />
          Cetak Resep &amp; SOP Dapur
        </Link>
      </div>

      {/* 4 Quadrants Summary Cards (Liquid Glass) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Stars */}
        <div className="p-3.5 bg-[#181920]/80 backdrop-blur-2xl border border-white/[0.08] rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-xs flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-emerald-600 text-emerald-600" />
              Stars
            </span>
            <Badge className="bg-emerald-700 text-white text-[10px]">{groupedMenus.stars.length} Menu</Badge>
          </div>
          <p className="text-xs text-slate-400 font-medium">Margin Tinggi • Laris Manis</p>
          <p className="text-[11px] text-slate-300">
            Pertahankan resep, tempatkan di posisi teratas buku menu, jangan ubah rasa.
          </p>
        </div>

        {/* Plowhorses */}
        <div className="p-3.5 bg-[#181920]/80 backdrop-blur-2xl border border-white/[0.08] rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-xs flex items-center gap-1.5">
              <Zap className="w-4 h-4 fill-blue-600 text-blue-600" />
              Plowhorses
            </span>
            <Badge className="bg-blue-700 text-white text-[10px]">{groupedMenus.plowhorses.length} Menu</Badge>
          </div>
          <p className="text-xs text-slate-400 font-medium">Laris Manis • Margin Tipis</p>
          <p className="text-[11px] text-slate-300">
            Favorit pelanggan. Naikkan harga bertahap Rp 1.000 atau negosiasi harga supplier bahan baku.
          </p>
        </div>

        {/* Puzzles */}
        <div className="p-3.5 bg-[#181920]/80 backdrop-blur-2xl border border-white/[0.08] rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-xs flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-amber-600" />
              Puzzles
            </span>
            <Badge className="bg-amber-700 text-white text-[10px]">{groupedMenus.puzzles.length} Menu</Badge>
          </div>
          <p className="text-xs text-slate-400 font-medium">Margin Tinggi • Kurang Laku</p>
          <p className="text-[11px] text-slate-300">
            Untung tebal tapi volume rendah. Beri insentif tim untuk upselling atau buat paket bundling.
          </p>
        </div>

        {/* Dogs */}
        <div className="p-3.5 bg-[#181920]/80 backdrop-blur-2xl border border-white/[0.08] rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-xs flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4 text-rose-600" />
              Dogs
            </span>
            <Badge className="bg-rose-700 text-white text-[10px]">{groupedMenus.dogs.length} Menu</Badge>
          </div>
          <p className="text-xs text-slate-400 font-medium">Margin Tipis • Kurang Laku</p>
          <p className="text-[11px] text-slate-300">
            Beban operasional. Evaluasi untuk dihapus dari menu atau ganti formulasi resep secara total.
          </p>
        </div>
      </div>

      {/* BCG Scatter Plot Matrix */}
      <div className="bg-[#181920]/80 backdrop-blur-2xl rounded-3xl border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Matriks Posisi Menu: Laba per Porsi (Rp) vs Volume Penjualan (Porsi)
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Garis putus-putus menunjukkan ambang batas rata-rata: Volume {formatNumber(averages.avgVolume, 0)} porsi dan Laba Kotor {formatIDR(averages.avgMargin)}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 30, bottom: 20, left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  type="number"
                  dataKey="volume"
                  name="Volume"
                  unit=" porsi"
                  label={{ value: "Volume Penjualan Bulanan (Porsi)", position: "insideBottom", offset: -10, fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey="margin"
                  name="Laba Kotor"
                  tickFormatter={(v) => `Rp ${(v / 1000).toFixed(0)}rb`}
                  label={{ value: "Laba Kotor Kontribusi (Rp)", angle: -90, position: "insideLeft", fontSize: 11 }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  content={({ payload }) => {
                    if (!payload || payload.length === 0) return null;
                    const p = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-lg shadow-lg text-xs space-y-1">
                        <div className="font-bold text-sm text-emerald-400">{p.name}</div>
                        <div>Kuadran: <strong>{p.quadrant}</strong></div>
                        <div>Harga: {formatIDR(p.sellingPrice)}</div>
                        <div>Laba: {formatIDR(p.margin)} ({formatNumber(100 - p.foodCostPct, 1)}%)</div>
                        <div>Volume: {formatNumber(p.volume, 0)} porsi</div>
                        <div className="pt-1 text-[11px] text-slate-300 border-t border-slate-700 mt-1">
                          Saran: {p.action}
                        </div>
                      </div>
                    );
                  }}
                />
                <ReferenceLine x={averages.avgVolume} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: "Rata-rata Volume", position: "top", fontSize: 10, fill: "#64748b" }} />
                <ReferenceLine y={averages.avgMargin} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: "Rata-rata Laba", position: "right", fontSize: 10, fill: "#64748b" }} />
                <Scatter name="Menus" data={scatterPoints}>
                  {scatterPoints.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={QUADRANT_COLORS[entry.quadrant as keyof typeof QUADRANT_COLORS] || "#059669"}
                      r={7}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </div>

      {/* Break-Even Point (BEP) Simulator */}
      <div className="bg-[#181920]/80 backdrop-blur-2xl rounded-3xl border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-400" />
            Simulator Titik Impas (BEP) Biaya Tetap Operasional
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Hitung berapa porsi menu dan omzet minimal setiap bulan dan hari untuk menutup seluruh biaya tetap operasional.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Fixed Cost Sliders (6 Cols) */}
            <div className="lg:col-span-6 space-y-3 p-3.5 bg-white/50 backdrop-blur-md rounded-2xl border border-white/75 shadow-xs">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Rincian Biaya Tetap Bulanan</span>
                <span className="text-white font-extrabold text-sm">{formatIDR(totalFixedCost)}</span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <Label className="text-xs">Sewa Tempat / Outlet:</Label>
                  <span className="font-bold text-white">{formatIDR(rentCost)}</span>
                </div>
                <Slider min={0} max={30000000} step={500000} value={rentCost} onChange={setRentCost} />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <Label className="text-xs">Gaji Karyawan Tetap:</Label>
                  <span className="font-bold text-white">{formatIDR(salariesCost)}</span>
                </div>
                <Slider min={0} max={40000000} step={500000} value={salariesCost} onChange={setSalariesCost} />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <Label className="text-xs">Utilitas (Listrik, Air, Gas &amp; WiFi):</Label>
                  <span className="font-bold text-white">{formatIDR(utilitiesCost)}</span>
                </div>
                <Slider min={0} max={15000000} step={250000} value={utilitiesCost} onChange={setUtilitiesCost} />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <Label className="text-xs">Perawatan &amp; Operasional Lain:</Label>
                  <span className="font-bold text-white">{formatIDR(otherOverhead)}</span>
                </div>
                <Slider min={0} max={10000000} step={250000} value={otherOverhead} onChange={setOtherOverhead} />
              </div>
            </div>

            {/* Right: Results (6 Cols) */}
            <div className="lg:col-span-6 flex flex-col justify-between space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-emerald-500/100/10 backdrop-blur-md border border-emerald-500/25 rounded-2xl space-y-1 shadow-xs">
                  <span className="text-emerald-900 font-medium text-xs">Target Porsi BEP Bulanan:</span>
                  <div className="text-xl font-extrabold text-emerald-400">
                    {formatNumber(bepResult.bepUnits, 0)} <span className="text-xs font-normal">porsi</span>
                  </div>
                  <div className="text-[11px] text-emerald-900 mt-1">
                    Atau minimal <strong>{bepResult.bepDailyUnits} porsi per hari</strong> (30 hari operasional)
                  </div>
                </div>

                <div className="p-3.5 bg-blue-500/10 backdrop-blur-md border border-blue-500/25 rounded-2xl space-y-1 shadow-xs">
                  <span className="text-blue-900 font-medium text-xs">Target Omzet BEP Bulanan:</span>
                  <div className="text-xl font-extrabold text-blue-800">
                    {formatIDR(bepResult.bepRevenue)}
                  </div>
                  <div className="text-[11px] text-blue-900 mt-1">
                    Omzet minimal agar laba operasional impas
                  </div>
                </div>
              </div>

              {/* Status Box */}
              <div className="p-3.5 bg-[#1a1a1d] rounded-xl border border-white/[0.1] space-y-2 text-xs shadow-xs">
                <div className="text-xs font-bold text-zinc-100 flex items-center justify-between">
                  <span>Status Volume Penjualan vs Titik Impas</span>
                  <span className="text-zinc-400 font-medium">{formatNumber(bepResult.totalVolume, 0)} porsi terjual</span>
                </div>

                {bepResult.totalVolume >= bepResult.bepUnits ? (
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>
                      Outlet beroperasi di atas BEP (+{formatNumber(bepResult.totalVolume - bepResult.bepUnits, 0)} porsi). Bisnis menghasilkan laba bersih positif.
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-rose-400 font-semibold">
                    <AlertOctagon className="w-4 h-4 shrink-0" />
                    <span>
                      Outlet masih di bawah BEP (-{formatNumber(bepResult.bepUnits - bepResult.totalVolume, 0)} porsi). Tingkatkan promosi menu Stars atau efisiensikan biaya tetap.
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-white/[0.08] flex justify-between text-zinc-300 text-[11px]">
                  <span>Rata-rata Laba Kotor per Porsi:</span>
                  <strong className="text-white">{formatIDR(bepResult.weightedAvgMargin)}</strong>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </div>
    </div>
  );
}
