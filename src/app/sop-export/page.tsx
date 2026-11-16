"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useOutlet } from "@/context/OutletContext";
import { formatIDR, formatNumber } from "@/lib/costing-engine";
import {
  FileText,
  Printer,
  Download,
  Eye,
  EyeOff,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select } from "@/components/ui/select";

export default function SopExportPage() {
  const { currentOutlet } = useOutlet();
  const [menus, setMenus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMenuId, setSelectedMenuId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("kitchen_sop");

  const fetchData = useCallback(async () => {
    if (!currentOutlet) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/menus?outletId=${currentOutlet.id}`);
      if (res.ok) {
        const mData = await res.json();
        const mList = mData.menus || [];
        setMenus(mList);
        if (mList.length > 0) {
          setSelectedMenuId(mList[0].id);
        }
      }
    } catch (err) {
      console.error("Gagal memuat data SOP:", err);
    } finally {
      setLoading(false);
    }
  }, [currentOutlet]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeMenu = useMemo(() => {
    return menus.find((m) => m.id === selectedMenuId) || menus[0] || null;
  }, [menus, selectedMenuId]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!activeMenu) return;

    const headers = [
      "No",
      "Tipe Item",
      "Nama Komponen",
      "Takaran/Qty",
      "Satuan",
      "Kanal Penggunaan",
      "Biaya Satuan (Rp)",
      "Subtotal HPP (Rp)",
    ];

    const rows = (activeMenu.recipeItems || []).map((it: any, idx: number) => {
      const isSub = it.itemType === "sub_recipe";
      const name = isSub ? it.subRecipe?.name : it.ingredient?.name;
      const unitCost = isSub
        ? it.subRecipe?.costPerYieldUnit || 0
        : it.ingredient?.effectiveUnitCost || 0;
      const subtotal = unitCost * it.quantity;

      return [
        idx + 1,
        isSub ? "Sub-Recipe" : "Bahan Baku",
        `"${name || "-"}"`,
        it.quantity,
        it.unit,
        it.channel === "online_only" ? "Takeaway Online" : "Semua",
        Math.round(unitCost),
        Math.round(subtotal),
      ];
    });

    rows.push([]);
    rows.push(["", "", "HPP Bahan Bersih", "", "", "", "", Math.round(activeMenu.dineIn?.baseIngredientsCost || 0)]);
    rows.push(["", "", `Waste Buffer (${activeMenu.wastePercent}%)`, "", "", "", "", Math.round(activeMenu.dineIn?.wasteCost || 0)]);
    rows.push(["", "", "Tenaga Kerja Langsung", "", "", "", "", Math.round(activeMenu.directLaborCost || 0)]);
    rows.push(["", "", "TOTAL HPP DINE-IN", "", "", "", "", Math.round(activeMenu.dineIn?.totalHPP || 0)]);
    rows.push(["", "", "Biaya Kemasan Online", "", "", "", "", Math.round(activeMenu.onlineDelivery?.packagingCost || 0)]);
    rows.push(["", "", "TOTAL HPP ONLINE DELIVERY", "", "", "", "", Math.round(activeMenu.onlineDelivery?.totalHPP || 0)]);
    rows.push(["", "", "HARGA JUAL DINE-IN", "", "", "", "", Math.round(activeMenu.sellingPriceDineIn || 0)]);
    rows.push(["", "", "FOOD COST % DINE-IN", "", "", "", "", `${(activeMenu.dineIn?.foodCostPercent || 0).toFixed(1)}%`]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e: any) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Kartu_HPP_${activeMenu.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header (Hidden on print) */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
            <FileText className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              SOP Resep Dapur &amp; Ekspor Kartu HPP
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Cetak Standar Operasional Prosedur (SOP) Dapur bersih tanpa harga untuk staf koki/barista, atau ekspor Kartu HPP lengkap untuk manajemen.
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

      {/* Sub Navigation Bar - Tab Switcher (Hidden on print) */}
      <div className="print:hidden flex flex-wrap items-center gap-1 p-1 bg-[#19191b] border border-white/[0.08] rounded-lg w-fit">
        <Link
          href="/menu-engineering"
          className="px-3 py-1.5 rounded-md text-xs font-medium text-[#85858b] hover:text-[#ededed] hover:bg-white/[0.04] transition-colors flex items-center gap-1.5"
        >
          <TrendingUp className="w-3.5 h-3.5 text-[#85858b]" />
          Matriks Performa &amp; BEP
        </Link>
        <span className="px-3 py-1.5 rounded-md text-xs font-medium bg-[#232325] text-[#ededed] border border-white/[0.08] flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-amber-400" />
          Cetak Resep &amp; SOP Dapur
        </span>
      </div>

      {/* Selector & Tabs (Hidden on print) */}
      <div className="print:hidden flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <Label className="text-xs text-slate-400 mb-1.5 block font-medium">Pilih Resep Menu:</Label>
          <Select
            value={selectedMenuId}
            onChange={(e) => setSelectedMenuId(e.target.value)}
            className="text-xs bg-[#16171d] text-white border-white/[0.1] rounded-xl focus:border-amber-500/50"
          >
            {menus.map((m) => (
              <option key={m.id} value={m.id} className="bg-[#16171d] text-white">
                {m.name} ({m.category})
              </option>
            ))}
          </Select>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList className="bg-[#181920]/90 border border-white/[0.08] p-1 rounded-full">
            <TabsTrigger value="kitchen_sop" className="rounded-full data-[state=active]:bg-white data-[state=active]:text-slate-950 text-slate-400 font-semibold text-xs px-4 py-1.5 transition-all">
              <EyeOff className="w-3.5 h-3.5 mr-1.5" />
              SOP Dapur (Tanpa Harga)
            </TabsTrigger>
            <TabsTrigger value="finance_hpp" className="rounded-full data-[state=active]:bg-white data-[state=active]:text-slate-950 text-slate-400 font-semibold text-xs px-4 py-1.5 transition-all">
              <Eye className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
              Kartu HPP (Finansial)
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Document Sheet Printable Area */}
      {loading ? (
        <div className="p-16 text-center text-slate-400">
          <div className="inline-block w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
          <div className="text-xs font-medium">Menyiapkan dokumen resep...</div>
        </div>
      ) : !activeMenu ? (
        <Card className="p-10 text-center text-slate-400 bg-[#181920]/80 border-white/[0.08] rounded-3xl text-xs">
          Belum ada resep menu yang dipilih.
        </Card>
      ) : (
        <div className="bg-[#181920]/90 backdrop-blur-2xl text-white border border-white/[0.08] print:bg-white print:text-slate-900 print:border-none shadow-[0_30px_90px_rgba(0,0,0,0.85)] rounded-3xl p-8 max-w-4xl mx-auto space-y-6 print:p-0 ring-1 ring-white/[0.03]">
          {/* Header Branding */}
          <div className="border-b-2 border-white/20 print:border-slate-900 pb-4 flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-amber-400/90 print:text-slate-500 font-bold">
                {currentOutlet?.name || "MarginOS"} • {currentOutlet?.category || "F&B"}
              </div>
              <h2 className="text-2xl font-black text-white print:text-slate-900 mt-1">
                {activeTab === "kitchen_sop" ? "STANDAR OPERASIONAL PROSEDUR (SOP) DAPUR" : "KARTU HARGA POKOK PENJUALAN (HPP)"}
              </h2>
              <div className="text-sm font-semibold text-emerald-400 print:text-emerald-800 mt-0.5">
                Menu: {activeMenu.name} {activeMenu.sku ? `(SKU: ${activeMenu.sku})` : ""}
              </div>
            </div>
            <div className="text-right text-xs text-slate-400 print:text-slate-500">
              <div>Kategori: <strong className="text-white print:text-slate-900">{activeMenu.category}</strong></div>
              <div>Tanggal: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</div>
              <div className="mt-1.5">
                <Badge variant={activeTab === "kitchen_sop" ? "secondary" : "default"} className="text-[10px] rounded-full px-2.5 py-0.5 font-bold">
                  {activeTab === "kitchen_sop" ? "Staf Koki / Barista" : "Finansial Manajemen"}
                </Badge>
              </div>
            </div>
          </div>

          {/* TAB 1: KITCHEN SOP (Clean Measurements, Zero Prices) */}
          {activeTab === "kitchen_sop" && (
            <div className="space-y-6">
              {/* Info Prep */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-white/[0.03] backdrop-blur-md rounded-2xl border border-white/[0.08] text-xs print:bg-slate-50 print:border print:border-slate-200 print:text-slate-900">
                <div>
                  <span className="text-slate-400 print:text-slate-500">Porsi Standar:</span>
                  <div className="font-bold text-white print:text-slate-900 mt-0.5">1 Porsi / Serving</div>
                </div>
                <div>
                  <span className="text-slate-400 print:text-slate-500">Toleransi Susut:</span>
                  <div className="font-bold text-white print:text-slate-900 mt-0.5">{activeMenu.wastePercent}%</div>
                </div>
                <div>
                  <span className="text-slate-400 print:text-slate-500">Kanal Penyajian:</span>
                  <div className="font-bold text-white print:text-slate-900 mt-0.5">Dine-In &amp; Takeaway</div>
                </div>
                <div>
                  <span className="text-slate-400 print:text-slate-500">Standar Mutu:</span>
                  <div className="font-bold text-emerald-400 print:text-emerald-800 mt-0.5">Quality Checked</div>
                </div>
              </div>

              {activeMenu.description && (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 print:bg-amber-50 print:border-amber-200 rounded-xl text-xs text-amber-200 print:text-amber-950">
                  <strong>Catatan Khusus Koki / Barista:</strong> {activeMenu.description}
                </div>
              )}

              {/* Takaran Bahan */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 print:text-slate-700">
                  Daftar Takaran Bahan Baku &amp; Olahan Resep
                </h3>
                <div className="overflow-x-auto rounded-2xl border border-white/[0.08] print:border-slate-300">
                  <table className="w-full text-xs divide-y divide-white/[0.08] print:divide-slate-300">
                    <thead className="bg-white/[0.04] print:bg-slate-100 text-slate-300 print:text-slate-800 font-semibold">
                      <tr>
                        <th className="p-2.5 text-left w-12">No</th>
                        <th className="p-2.5 text-left">Nama Bahan Baku / Sub-Recipe</th>
                        <th className="p-2.5 text-left">Tipe Komponen</th>
                        <th className="p-2.5 text-right">Takaran Timbangan</th>
                        <th className="p-2.5 text-left pl-4">Kanal Pemakaian</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04] print:divide-slate-200">
                      {activeMenu.recipeItems?.map((it: any, idx: number) => {
                        const isSub = it.itemType === "sub_recipe";
                        const name = isSub ? it.subRecipe?.name : it.ingredient?.name;
                        return (
                          <tr key={idx} className={it.channel === "online_only" ? "bg-amber-500/[0.04] print:bg-blue-50/40" : ""}>
                            <td className="p-2.5 text-slate-400 print:text-slate-500">{idx + 1}</td>
                            <td className="p-2.5 font-bold text-white print:text-slate-900">{name || "Bahan Baku"}</td>
                            <td className="p-2.5 text-slate-300 print:text-slate-600">
                              {isSub ? "Olahan Dasar (Sub-Recipe)" : "Bahan Baku Mentah"}
                            </td>
                            <td className="p-2.5 text-right font-black text-amber-400 print:text-slate-900">
                              {formatNumber(it.quantity)} {it.unit}
                            </td>
                            <td className="p-2.5 pl-4 text-slate-300 print:text-slate-600">
                              {it.channel === "online_only" ? "Khusus Kemasan Takeaway/Online" : "Semua Pesanan"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Langkah SOP */}
              <div className="space-y-2 pt-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 print:text-slate-700">
                  Langkah Pembuatan &amp; Penyajian Standar (SOP)
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300 print:text-slate-800 bg-white/[0.03] print:bg-slate-50 p-4 rounded-2xl border border-white/[0.08] print:border-none">
                  <li>Pastikan timbangan digital terkalibrasi ke angka 0 sebelum menimbang.</li>
                  <li>Ambil bahan baku dan sub-recipe olahan sesuai dengan urutan gramasi di atas tanpa menambah atau mengurangi takaran.</li>
                  <li>Jika pesanan adalah <strong>Takeaway / Delivery</strong>, gunakan cup/lid/box kemasan khusus yang tertera pada tabel di atas.</li>
                  <li>Pastikan suhu penyajian (panas/dingin) terjaga sebelum diserahkan ke pelanggan atau kurir delivery.</li>
                  <li>Tutup kembali wadah bahan olahan dan segera simpan ke dalam chiller / tempat penyimpanan tertutup sesuai SOP sanitasi.</li>
                </ol>
              </div>

              {/* Tanda Tangan */}
              <div className="pt-6 grid grid-cols-2 gap-8 text-xs text-center">
                <div className="space-y-10">
                  <div className="font-semibold text-slate-400 print:text-slate-600">Disiapkan Oleh (Cook / Barista):</div>
                  <div className="border-t border-white/20 print:border-slate-400 mx-8 pt-1 text-slate-300 print:text-slate-800">
                    ( .................................................. )
                  </div>
                </div>
                <div className="space-y-10">
                  <div className="font-semibold text-slate-400 print:text-slate-600">Disetujui Head Kitchen / Supervisor:</div>
                  <div className="border-t border-white/20 print:border-slate-400 mx-8 pt-1 text-slate-300 print:text-slate-800">
                    ( .................................................. )
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FINANCE HPP CARD */}
          {activeTab === "finance_hpp" && (
            <div className="space-y-6">
              {/* Financial KPI */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-white/[0.03] backdrop-blur-md rounded-2xl border border-white/[0.08] text-xs print:bg-slate-50 print:border print:border-slate-200 print:text-slate-900">
                <div>
                  <span className="text-slate-400 print:text-slate-500">Harga Jual Dine-In:</span>
                  <div className="font-black text-white print:text-slate-900 text-sm mt-0.5">
                    {formatIDR(activeMenu.sellingPriceDineIn)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 print:text-slate-500">Total HPP Dine-In:</span>
                  <div className="font-black text-emerald-400 print:text-emerald-800 text-sm mt-0.5">
                    {formatIDR(activeMenu.dineIn?.totalHPP || 0)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 print:text-slate-500">Food Cost Dine-In:</span>
                  <div className="font-black text-emerald-400 print:text-emerald-700 text-sm mt-0.5">
                    {formatNumber(activeMenu.dineIn?.foodCostPercent || 0, 1)}%
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 print:text-slate-500">Laba Kotor:</span>
                  <div className="font-black text-amber-400 print:text-slate-900 text-sm mt-0.5">
                    +{formatIDR(activeMenu.dineIn?.grossProfit || 0)}
                  </div>
                </div>
              </div>

              {/* Financial Cost Table */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 print:text-slate-700">
                  Rincian Biaya Pokok Penjualan (HPP) per Porsi
                </h3>
                <div className="overflow-x-auto rounded-2xl border border-white/[0.08] print:border-slate-300">
                  <table className="w-full text-xs divide-y divide-white/[0.08] print:divide-slate-300">
                    <thead className="bg-white/[0.04] print:bg-slate-100 text-slate-300 print:text-slate-800 font-semibold">
                      <tr>
                        <th className="p-2.5 text-left w-12">No</th>
                        <th className="p-2.5 text-left">Komponen Resep</th>
                        <th className="p-2.5 text-right">Takaran</th>
                        <th className="p-2.5 text-right">Biaya Satuan Efektif</th>
                        <th className="p-2.5 text-right">Subtotal HPP</th>
                        <th className="p-2.5 text-left pl-3">Alokasi Kanal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04] print:divide-slate-200">
                      {activeMenu.recipeItems?.map((it: any, idx: number) => {
                        const isSub = it.itemType === "sub_recipe";
                        const name = isSub ? it.subRecipe?.name : it.ingredient?.name;
                        const unitCost = isSub
                          ? it.subRecipe?.costPerYieldUnit || 0
                          : it.ingredient?.effectiveUnitCost || 0;
                        const subtotal = unitCost * it.quantity;

                        return (
                          <tr key={idx} className={it.channel === "online_only" ? "bg-amber-500/[0.04] print:bg-blue-50/30" : ""}>
                            <td className="p-2.5 text-slate-400 print:text-slate-500">{idx + 1}</td>
                            <td className="p-2.5 font-bold text-white print:text-slate-900">
                              {name || "Bahan Baku"}
                              {isSub && <span className="text-[10px] text-emerald-400 print:text-emerald-800 font-normal"> (Sub-Recipe)</span>}
                            </td>
                            <td className="p-2.5 text-right text-slate-300 print:text-slate-900">
                              {formatNumber(it.quantity)} {it.unit}
                            </td>
                            <td className="p-2.5 text-right text-slate-400 print:text-slate-600">
                              {formatIDR(unitCost)}/{it.unit}
                            </td>
                            <td className="p-2.5 text-right font-black text-amber-400 print:text-slate-900">
                              {formatIDR(subtotal)}
                            </td>
                            <td className="p-2.5 pl-3 text-slate-400 print:text-slate-600">
                              {it.channel === "online_only" ? "Online Takeaway (Kemasan)" : "Dine-In & Online"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-white/[0.02] print:bg-slate-50 font-semibold border-t-2 border-white/[0.1] print:border-slate-300 text-xs">
                      <tr>
                        <td colSpan={4} className="p-2.5 text-right text-slate-400 print:text-slate-600">Subtotal Bahan Bersih:</td>
                        <td className="p-2.5 text-right font-black text-white print:text-slate-900">
                          {formatIDR(activeMenu.dineIn?.baseIngredientsCost || 0)}
                        </td>
                        <td></td>
                      </tr>
                      <tr>
                        <td colSpan={4} className="p-2.5 text-right text-slate-400 print:text-slate-600">Toleransi Waste ({activeMenu.wastePercent}%):</td>
                        <td className="p-2.5 text-right text-slate-300 print:text-slate-900">
                          +{formatIDR(activeMenu.dineIn?.wasteCost || 0)}
                        </td>
                        <td></td>
                      </tr>
                      <tr>
                        <td colSpan={4} className="p-2.5 text-right text-slate-400 print:text-slate-600">Tenaga Kerja per Porsi:</td>
                        <td className="p-2.5 text-right text-slate-300 print:text-slate-900">
                          +{formatIDR(activeMenu.directLaborCost || 0)}
                        </td>
                        <td></td>
                      </tr>
                      <tr className="bg-emerald-500/[0.08] print:bg-emerald-50 font-black">
                        <td colSpan={4} className="p-2.5 text-right text-emerald-400 print:text-emerald-950">TOTAL HPP DINE-IN:</td>
                        <td className="p-2.5 text-right text-emerald-400 print:text-emerald-900 font-black text-sm">
                          {formatIDR(activeMenu.dineIn?.totalHPP || 0)}
                        </td>
                        <td className="p-2.5 pl-3 text-emerald-400 print:text-emerald-800 font-bold">
                          FC: {formatNumber(activeMenu.dineIn?.foodCostPercent || 0, 1)}%
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={4} className="p-2.5 text-right text-amber-400/90 print:text-blue-900">Biaya Kemasan Online:</td>
                        <td className="p-2.5 text-right text-amber-400 print:text-blue-900">
                          +{formatIDR(activeMenu.onlineDelivery?.packagingCost || 0)}
                        </td>
                        <td className="p-2.5 pl-3 text-slate-400 print:text-blue-700">Kemasan Delivery</td>
                      </tr>
                      <tr className="bg-amber-500/[0.08] print:bg-blue-50 font-black">
                        <td colSpan={4} className="p-2.5 text-right text-amber-400 print:text-blue-950">TOTAL HPP ONLINE:</td>
                        <td className="p-2.5 text-right text-amber-400 print:text-blue-900 font-black text-sm">
                          {formatIDR(activeMenu.onlineDelivery?.totalHPP || 0)}
                        </td>
                        <td className="p-2.5 pl-3 text-amber-400 print:text-blue-800 font-bold">
                          FC: {formatNumber(activeMenu.onlineDelivery?.foodCostPercent || 0, 1)}%
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Tanda Tangan Manajemen */}
              <div className="pt-6 grid grid-cols-2 gap-8 text-xs text-center">
                <div className="space-y-10">
                  <div className="font-semibold text-slate-400 print:text-slate-600">Dibuat Oleh (Finance / Cost Control):</div>
                  <div className="border-t border-white/20 print:border-slate-400 mx-8 pt-1 text-slate-300 print:text-slate-800">
                    ( .................................................. )
                  </div>
                </div>
                <div className="space-y-10">
                  <div className="font-semibold text-slate-400 print:text-slate-600">Disetujui Oleh (Owner / General Manager):</div>
                  <div className="border-t border-white/20 print:border-slate-400 mx-8 pt-1 text-slate-300 print:text-slate-800">
                    ( .................................................. )
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
