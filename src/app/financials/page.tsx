"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useOutlet } from "@/context/OutletContext";
import { formatIDR, formatNumber } from "@/lib/costing-engine";
import {
  TrendingUp,
  DollarSign,
  PieChart,
  Calendar,
  Download,
  Printer,
  CheckCircle2,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Sparkles,
  Building2,
  Percent,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";

export default function FinancialsPage() {
  const { currentOutlet } = useOutlet();
  const [loading, setLoading] = useState(true);
  const [menus, setMenus] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [period, setPeriod] = useState("THIS_MONTH");

  const fetchData = useCallback(async () => {
    if (!currentOutlet) return;
    try {
      setLoading(true);
      const [mRes, pRes] = await Promise.all([
        fetch(`/api/menus?outletId=${currentOutlet.id}`),
        fetch(`/api/purchases?outletId=${currentOutlet.id}`),
      ]);

      if (mRes.ok) {
        const mData = await mRes.json();
        setMenus(mData.menus || []);
      }

      if (pRes.ok) {
        const pData = await pRes.json();
        setPurchases(pData.purchases || []);
      }
    } catch (err) {
      console.error("Gagal memuat laporan finansial:", err);
    } finally {
      setLoading(false);
    }
  }, [currentOutlet]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculations
  const totalRevenue = menus.reduce((acc, m) => {
    const qty = m.estimatedMonthlySales || 100;
    const price = m.sellingPriceDineIn || 0;
    return acc + qty * price;
  }, 0);

  const totalCOGS = menus.reduce((acc, m) => {
    const qty = m.estimatedMonthlySales || 100;
    const hpp = m.dineIn?.totalHPP || 0;
    return acc + qty * hpp;
  }, 0);

  const grossProfit = totalRevenue - totalCOGS;
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const foodCostPercent = totalRevenue > 0 ? (totalCOGS / totalRevenue) * 100 : 0;

  // Fixed Monthly Overhead from current outlet
  const fixedOverhead = currentOutlet?.monthlyFixedCost || 15000000;
  const netProfit = grossProfit - fixedOverhead;
  const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Target Food Cost Health
  const targetFC = currentOutlet?.targetFoodCostPercent || 30.0;
  const isHealthy = foodCostPercent <= targetFC;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const rows = [
      ["LAPORAN LABA RUGI (P&L STATEMENT)", currentOutlet?.name || "MarginOS"],
      ["Periode", new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })],
      [],
      ["Komponen Finansial", "Nominal (Rp)", "Persentase (%)"],
      ["Total Omset Penjualan (Revenue)", Math.round(totalRevenue), "100.0%"],
      ["Biaya Pokok Penjualan (HPP / COGS)", Math.round(totalCOGS), `${foodCostPercent.toFixed(1)}%`],
      ["Laba Kotor (Gross Profit)", Math.round(grossProfit), `${grossMargin.toFixed(1)}%`],
      ["Beban Operasional Toko (Sewa & Gaji)", Math.round(fixedOverhead), `${((fixedOverhead / (totalRevenue || 1)) * 100).toFixed(1)}%`],
      ["LABA BERSIH AKHIR (NET PROFIT)", Math.round(netProfit), `${netMargin.toFixed(1)}%`],
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_P&L_${currentOutlet?.name || "F&B"}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-amber-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
            <PieChart className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              Laporan Finansial &amp; Laba Rugi (P&amp;L)
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Ringkasan pembukuan laba kotor, HPP riil, beban operasional toko (sewa &amp; gaji), serta laba bersih bulanan.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-white border-white/[0.1] text-xs font-semibold px-4 py-2 transition-all"
          >
            <Download className="w-4 h-4 mr-1.5" /> Ekspor CSV
          </Button>
          <Button
            onClick={handlePrint}
            className="rounded-full bg-white hover:bg-slate-200 text-slate-950 text-xs font-black shadow-lg shadow-white/10 px-4 py-2 transition-all"
          >
            <Printer className="w-4 h-4 mr-1.5" /> Cetak (Print)
          </Button>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Revenue */}
        <div className="bg-[#181920]/80 backdrop-blur-2xl rounded-3xl border border-white/[0.08] p-4 flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Estimasi Omset Penjualan
            </span>
            <div className="text-xl font-black text-white mt-1">
              {formatIDR(totalRevenue)}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Dari {menus.length} menu aktif
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-amber-400">
            <DollarSign className="w-5 h-5 text-amber-400" />
          </div>
        </div>

        {/* Card 2: COGS / Food Cost */}
        <div className="bg-[#181920]/80 backdrop-blur-2xl rounded-3xl border border-white/[0.08] p-4 flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Beban Pokok Penjualan (HPP)
            </span>
            <div className="text-xl font-black text-white mt-1">
              {formatIDR(totalCOGS)}
            </div>
            <span className={`text-[11px] font-bold ${isHealthy ? "text-emerald-400" : "text-rose-400"}`}>
              {foodCostPercent.toFixed(1)}% Food Cost (Target: {targetFC}%)
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-orange-400">
            <Percent className="w-5 h-5 text-orange-400" />
          </div>
        </div>

        {/* Card 3: Gross Profit */}
        <div className="bg-[#181920]/80 backdrop-blur-2xl rounded-3xl border border-white/[0.08] p-4 flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Laba Kotor (Gross Profit)
            </span>
            <div className="text-xl font-black text-emerald-400 mt-1">
              +{formatIDR(grossProfit)}
            </div>
            <span className="text-[11px] text-emerald-400/90 font-medium">
              Margin Kotor: {grossMargin.toFixed(1)}%
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ArrowUpRight className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        {/* Card 4: Net Profit */}
        <div className="bg-[#181920]/80 backdrop-blur-2xl rounded-3xl border border-white/[0.08] p-4 flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Laba Bersih Akhir (Net Profit)
            </span>
            <div className={`text-xl font-black mt-1 ${netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {netProfit >= 0 ? "+" : ""}{formatIDR(netProfit)}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Margin Bersih: {netMargin.toFixed(1)}%
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-amber-400">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
        </div>
      </div>

      {/* P&L Statement Sheet */}
      <div className="bg-[#181920]/90 backdrop-blur-2xl rounded-3xl border border-white/[0.08] p-6 sm:p-8 space-y-6 shadow-[0_30px_90px_rgba(0,0,0,0.85)] print:bg-white print:text-slate-900 print:border-none print:shadow-none print:p-0">
        <div className="border-b-2 border-white/20 print:border-slate-900 pb-4 flex items-start justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-amber-400/90 print:text-slate-500 font-bold">
              {currentOutlet?.name || "MarginOS"} • Laporan Keuangan F&amp;B
            </div>
            <h2 className="text-2xl font-black text-white print:text-slate-900 mt-1">
              LAPORAN LABA RUGI BULANAN (P&amp;L STATEMENT)
            </h2>
            <p className="text-xs text-slate-400 print:text-slate-600 mt-0.5">
              Cabang: {currentOutlet?.name} ({currentOutlet?.category})
            </p>
          </div>
          <div className="text-right text-xs text-slate-400 print:text-slate-500">
            <div>Periode: <strong>{new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</strong></div>
            <div className="mt-1">
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] font-bold rounded-full">
                {isHealthy ? "Food Cost Terkendali" : "Perlu Evaluasi Porsi"}
              </Badge>
            </div>
          </div>
        </div>

        {/* P&L Table */}
        <div className="overflow-x-auto rounded-2xl border border-white/[0.08] print:border-slate-300">
          <table className="w-full text-xs divide-y divide-white/[0.08] print:divide-slate-300">
            <thead className="bg-[#18181b] print:bg-slate-100 text-zinc-200 print:text-slate-800 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3 text-left">Komponen Finansial</th>
                <th className="p-3 text-right">Rasio (%)</th>
                <th className="p-3 text-right pr-4">Total Nominal (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] print:divide-slate-200">
              {/* Revenue */}
              <tr className="bg-white/[0.02] font-bold">
                <td className="p-3 text-white print:text-slate-900">1. PENDAPATAN OMSET PENJUALAN</td>
                <td className="p-3 text-right text-slate-400">100.0%</td>
                <td className="p-3 text-right pr-4 font-black text-white print:text-slate-900 text-sm">
                  {formatIDR(totalRevenue)}
                </td>
              </tr>

              {/* COGS */}
              <tr>
                <td className="p-3 pl-6 text-slate-300 print:text-slate-700">
                  (-) Beban Pokok Penjualan (HPP Bahan Bersih &amp; Waste)
                </td>
                <td className="p-3 text-right text-rose-400 print:text-rose-700">
                  {foodCostPercent.toFixed(1)}%
                </td>
                <td className="p-3 text-right pr-4 text-rose-400 print:text-rose-700 font-bold">
                  -{formatIDR(totalCOGS)}
                </td>
              </tr>

              {/* Gross Profit */}
              <tr className="bg-emerald-500/[0.08] print:bg-emerald-50 font-black">
                <td className="p-3 text-emerald-400 print:text-emerald-950">2. LABA KOTOR (GROSS PROFIT)</td>
                <td className="p-3 text-right text-emerald-400 print:text-emerald-900 font-black">
                  {grossMargin.toFixed(1)}%
                </td>
                <td className="p-3 text-right pr-4 font-black text-emerald-400 print:text-emerald-900 text-sm">
                  +{formatIDR(grossProfit)}
                </td>
              </tr>

              {/* Fixed Costs */}
              <tr>
                <td className="p-3 pl-6 text-slate-300 print:text-slate-700">
                  (-) Beban Operasional Tetap Toko (Sewa Tempat, Gaji Karyawan, Listrik/Air)
                </td>
                <td className="p-3 text-right text-slate-400">
                  {totalRevenue > 0 ? ((fixedOverhead / totalRevenue) * 100).toFixed(1) : 0}%
                </td>
                <td className="p-3 text-right pr-4 text-slate-300 print:text-slate-800 font-bold">
                  -{formatIDR(fixedOverhead)}
                </td>
              </tr>

              {/* Net Profit */}
              <tr className="bg-white/[0.06] print:bg-slate-200 font-black border-t-2 border-white/20 print:border-slate-400">
                <td className="p-3.5 text-white print:text-slate-950 text-sm">3. LABA BERSIH AKHIR (NET PROFIT)</td>
                <td className="p-3.5 text-right font-black text-amber-400 print:text-slate-900 text-sm">
                  {netMargin.toFixed(1)}%
                </td>
                <td className={`p-3.5 text-right pr-4 font-black text-base ${netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {netProfit >= 0 ? "+" : ""}{formatIDR(netProfit)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* AI Insight Box */}
        <div className="p-4 rounded-2xl bg-amber-500/[0.06] border border-amber-500/20 text-xs text-amber-200 print:bg-amber-50 print:text-amber-950">
          <strong className="block mb-1 font-bold">💡 Analisis Margin &amp; Efisiensi Dapur:</strong>
          {isHealthy ? (
            <p>
              Food cost cabang saat ini berada pada angka <strong>{foodCostPercent.toFixed(1)}%</strong>, berada di bawah target maksimal <strong>{targetFC}%</strong>. Margin keuntungan bersih Anda sehat. Pertahankan SOP takaran gramasi agar tidak terjadi kebocoran bahan (*leakage*).
            </p>
          ) : (
            <p>
              Food cost cabang saat ini mencapai <strong>{foodCostPercent.toFixed(1)}%</strong>, melebihi batas target <strong>{targetFC}%</strong>. Pertimbangkan menaikkan harga jual porsi atau evaluasi porsi bahan baku berharga tinggi di menu katalog.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
