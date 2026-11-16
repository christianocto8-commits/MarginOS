"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useOutlet } from "@/context/OutletContext";
import { formatIDR, formatNumber } from "@/lib/costing-engine";
import {
  ClipboardCheck,
  Plus,
  Calendar,
  Package,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

interface InventoryLogItem {
  id: string;
  ingredientId: string;
  beginningStock: number;
  purchases: number;
  endingStock: number;
  actualUsage: number;
  theoreticalUsage: number;
  varianceQty: number;
  varianceCost: number;
  unitCost: number;
  notes?: string;
  ingredient: {
    name: string;
    purchaseUnit: string;
    category: string;
  };
}

interface InventoryPeriod {
  id: string;
  periodName: string;
  startDate: string;
  endDate: string;
  status: string;
  totalRevenue: number;
  theoreticalCOGS: number;
  actualCOGS: number;
  varianceAmount: number;
  variancePercent: number;
  notes?: string;
  logs: InventoryLogItem[];
}

export default function CogsInventoryPage() {
  const { currentOutlet } = useOutlet();
  const [periods, setPeriods] = useState<InventoryPeriod[]>([]);
  const [availableIngredients, setAvailableIngredients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<InventoryPeriod | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formPeriod, setFormPeriod] = useState({
    periodName: "Audit Stok Opname November 2026",
    startDate: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    totalRevenue: 65000000,
    theoreticalCOGS: 18500000,
    notes: "",
  });

  const [formLogs, setFormLogs] = useState<
    Array<{
      ingredientId: string;
      name: string;
      unit: string;
      unitCost: number;
      beginningStock: number;
      purchases: number;
      endingStock: number;
      theoreticalUsage: number;
    }>
  >([]);

  const fetchPeriods = useCallback(async () => {
    if (!currentOutlet) return;
    try {
      setLoading(true);
      const [resPeriods, resIng] = await Promise.all([
        fetch(`/api/inventory?outletId=${currentOutlet.id}`),
        fetch(`/api/ingredients?outletId=${currentOutlet.id}`),
      ]);

      if (resPeriods.ok && resIng.ok) {
        const pData = await resPeriods.json();
        const iData = await resIng.json();
        setPeriods(pData);
        setAvailableIngredients(iData);
        if (pData.length > 0) {
          setSelectedPeriod(pData[0]);
        }
      }
    } catch (err) {
      console.error("Gagal memuat audit stok:", err);
    } finally {
      setLoading(false);
    }
  }, [currentOutlet]);

  useEffect(() => {
    fetchPeriods();
  }, [fetchPeriods]);

  const handleOpenAdd = () => {
    const logs = availableIngredients.map((ing) => ({
      ingredientId: ing.id,
      name: ing.name,
      unit: ing.purchaseUnit,
      unitCost: ing.purchasePrice / (ing.packageSize || 1),
      beginningStock: ing.currentStock || 10,
      purchases: 20,
      endingStock: ing.currentStock > 5 ? ing.currentStock - 5 : 2,
      theoreticalUsage: 25,
    }));

    setFormLogs(logs);
    setFormPeriod({
      periodName: `Audit Stok Opname ${new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}`,
      startDate: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      totalRevenue: 50000000,
      theoreticalCOGS: 15000000,
      notes: "Audit fisik berkala outlet",
    });
    setIsModalOpen(true);
  };

  const handleLogChange = (idx: number, field: string, val: number) => {
    const updated = [...formLogs];
    updated[idx] = { ...updated[idx], [field]: val };
    setFormLogs(updated);
  };

  const formCalculation = useMemo(() => {
    let totalActualCOGS = 0;
    const items = formLogs.map((l) => {
      const actualUsage = Math.max(0, l.beginningStock + l.purchases - l.endingStock);
      const rowActualCost = actualUsage * l.unitCost;
      totalActualCOGS += rowActualCost;

      const varianceQty = actualUsage - l.theoreticalUsage;
      const varianceCost = varianceQty * l.unitCost;

      return {
        ...l,
        actualUsage,
        rowActualCost,
        varianceQty,
        varianceCost,
      };
    });

    const varianceAmount = totalActualCOGS - formPeriod.theoreticalCOGS;
    const variancePercent =
      formPeriod.theoreticalCOGS > 0 ? (varianceAmount / formPeriod.theoreticalCOGS) * 100 : 0;

    return {
      items,
      totalActualCOGS,
      varianceAmount,
      variancePercent,
    };
  }, [formLogs, formPeriod]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOutlet) return;

    try {
      setSaving(true);
      const payload = {
        outletId: currentOutlet.id,
        ...formPeriod,
        logs: formCalculation.items,
      };

      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Gagal menyimpan audit");

      setIsModalOpen(false);
      fetchPeriods();
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan audit inventori.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.25)]">
              <ClipboardCheck className="w-4 h-4" />
            </div>
            COGS Aktual &amp; Analisis Varians Stok Opname
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Hitung COGS aktual berdasarkan formula fisik: <span className="font-semibold text-slate-200">(Stok Awal + Pembelian) - Stok Akhir</span>, lalu bandingkan dengan resep teoritis.
          </p>
        </div>
        <Button onClick={handleOpenAdd} variant="pill" size="default" className="shadow-[0_4px_20px_rgba(255,255,255,0.2)] flex items-center gap-1.5 min-h-[44px]">
          <Plus className="w-4 h-4" />
          Catat Stok Opname Baru
        </Button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <div className="inline-block w-6 h-6 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin mb-2" />
          <div className="text-xs">Memuat data audit stok...</div>
        </div>
      ) : periods.length === 0 ? (
        <Card className="p-10 text-center text-slate-400">
          <ClipboardCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-200">Belum ada Audit Stok Opname</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Lakukan audit stok berkala untuk mendeteksi selisih antara bahan baku di sistem vs fisik di gudang.
          </p>
          <Button onClick={handleOpenAdd} className="mt-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs">
            <Plus className="w-4 h-4 mr-1" /> Catat Audit Pertama
          </Button>
        </Card>
      ) : (
        <div className="space-y-5">
          {/* Period Selector Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {periods.map((p) => {
              const isSelected = selectedPeriod?.id === p.id;
              const isLeakage = p.varianceAmount > 0;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPeriod(p)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? "border-emerald-500/40 bg-emerald-500/10 backdrop-blur-2xl shadow-[0_10px_30px_rgba(0,0,0,0.4)] ring-1 ring-emerald-500/40"
                      : "border-white/[0.08] bg-[#181920]/80 backdrop-blur-2xl hover:border-white/[0.15] shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(p.startDate).toLocaleDateString("id-ID", { month: "short", year: "numeric" })}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg backdrop-blur-xs ${
                        isLeakage
                          ? "bg-rose-500/15 text-rose-800 border border-rose-500/25"
                          : "bg-emerald-500/15 text-emerald-800 border border-emerald-500/25"
                      }`}
                    >
                      {isLeakage ? `Selisih +${formatNumber(p.variancePercent, 1)}%` : "Klop 0%"}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-sm mt-1 line-clamp-1">{p.periodName}</h3>
                  <div className="mt-2 pt-2 border-t border-white/[0.08]/50 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px]">COGS Aktual:</span>
                      <div className="font-bold text-white">{formatIDR(p.actualCOGS)}</div>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px]">Selisih Biaya:</span>
                      <div className={`font-bold ${isLeakage ? "text-rose-700" : "text-emerald-700"}`}>
                        {formatIDR(p.varianceAmount)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Period Detailed Report */}
          {selectedPeriod && (
            <div className="bg-[#181920]/80 backdrop-blur-2xl rounded-3xl border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-bold text-white">
                      {selectedPeriod.periodName}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400 mt-0.5">
                      Periode: {new Date(selectedPeriod.startDate).toLocaleDateString("id-ID")} sampai{" "}
                      {new Date(selectedPeriod.endDate).toLocaleDateString("id-ID")} • Omzet:{" "}
                      <strong className="text-slate-200">{formatIDR(selectedPeriod.totalRevenue)}</strong>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 3 Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-4 bg-white/[0.03] backdrop-blur-md rounded-2xl border border-white/[0.06] shadow-xs">
                    <span className="text-slate-400">1. COGS Teoritis Resep:</span>
                    <div className="text-xl font-bold text-white mt-1">
                      {formatIDR(selectedPeriod.theoreticalCOGS)}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Berdasarkan pesanan kasir POS
                    </div>
                  </div>

                  <div className="p-4 bg-white/[0.03] backdrop-blur-md rounded-2xl border border-white/[0.06] shadow-xs">
                    <span className="text-slate-400">2. COGS Aktual Fisik:</span>
                    <div className="text-xl font-bold text-white mt-1">
                      {formatIDR(selectedPeriod.actualCOGS)}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Hasil opname stok gudang
                    </div>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl border backdrop-blur-md shadow-xs ${
                      selectedPeriod.varianceAmount > 0
                        ? "bg-rose-500/10 border-rose-500/25"
                        : "bg-emerald-500/10 border-emerald-500/25"
                    }`}
                  >
                    <span className="text-zinc-400 font-medium">3. Selisih / Kerugian Fisik:</span>
                    <div
                      className={`text-xl font-extrabold mt-1 ${
                        selectedPeriod.varianceAmount > 0 ? "text-rose-700" : "text-emerald-700"
                      }`}
                    >
                      {formatIDR(selectedPeriod.varianceAmount)}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {selectedPeriod.varianceAmount > 0
                        ? `Ada kebocoran +${formatNumber(selectedPeriod.variancePercent, 1)}% dari resep`
                        : "Stok fisik sesuai standar resep"}
                    </div>
                  </div>
                </div>

                {/* Table Breakdown */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                    Rincian Pemakaian per Bahan Baku ({selectedPeriod.logs?.length || 0} item)
                  </span>
                  <div className="border border-white/[0.08] rounded-lg overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-[#18181b]">
                        <TableRow>
                          <TableHead className="text-zinc-300 font-semibold text-xs">Nama Bahan</TableHead>
                          <TableHead className="text-zinc-300 font-semibold text-xs">Stok Awal</TableHead>
                          <TableHead className="text-zinc-300 font-semibold text-xs">Beli Masuk</TableHead>
                          <TableHead className="text-zinc-300 font-semibold text-xs">Stok Akhir</TableHead>
                          <TableHead className="text-zinc-300 font-semibold text-xs">Pakai Aktual</TableHead>
                          <TableHead className="text-zinc-300 font-semibold text-xs">Teoritis Resep</TableHead>
                          <TableHead className="text-zinc-300 font-semibold text-xs">Selisih Fisik</TableHead>
                          <TableHead className="text-right text-zinc-300 font-semibold text-xs">Nominal Selisih</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedPeriod.logs?.map((log) => {
                          const isLoss = log.varianceCost > 0;
                          return (
                            <TableRow key={log.id} className="hover:bg-white/[0.04] text-xs">
                              <TableCell className="font-semibold text-white">
                                {log.ingredient.name}
                                <span className="text-[10px] text-slate-400 block font-normal">
                                  {log.ingredient.category}
                                </span>
                              </TableCell>
                              <TableCell>
                                {formatNumber(log.beginningStock)} {log.ingredient.purchaseUnit}
                              </TableCell>
                              <TableCell>
                                +{formatNumber(log.purchases)} {log.ingredient.purchaseUnit}
                              </TableCell>
                              <TableCell>
                                {formatNumber(log.endingStock)} {log.ingredient.purchaseUnit}
                              </TableCell>
                              <TableCell className="font-bold text-white">
                                {formatNumber(log.actualUsage)} {log.ingredient.purchaseUnit}
                              </TableCell>
                              <TableCell className="text-slate-400">
                                {formatNumber(log.theoreticalUsage)} {log.ingredient.purchaseUnit}
                              </TableCell>
                              <TableCell>
                                <span className={isLoss ? "text-rose-700 font-bold" : "text-emerald-700 font-medium"}>
                                  {isLoss ? `+${formatNumber(log.varianceQty)}` : formatNumber(log.varianceQty)} {log.ingredient.purchaseUnit}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className={`font-bold ${isLoss ? "text-rose-700" : "text-slate-400"}`}>
                                  {isLoss ? `+${formatIDR(log.varianceCost)}` : formatIDR(log.varianceCost)}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </div>
          )}
        </div>
      )}

      {/* Modal Input Opname Baru - Simple, Wide & User Friendly */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="4xl"
        title="Formulir Stok Opname &amp; Audit COGS"
        description="Masukkan data fisik stok awal, pembelian, dan stok akhir gudang untuk mendeteksi varians."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Identitas Periode */}
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-4 border border-white/[0.08] space-y-3">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              1. Identitas Periode Audit
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
              <div className="sm:col-span-8 space-y-1">
                <Label className="text-xs font-semibold text-slate-200">Nama Periode Audit *</Label>
                <Input
                  required
                  placeholder="Misal: Audit Mingguan 1 - 7 Nov 2026"
                  value={formPeriod.periodName}
                  onChange={(e) => setFormPeriod({ ...formPeriod, periodName: e.target.value })}
                  className="text-xs"
                />
              </div>
              <div className="sm:col-span-4 space-y-1">
                <Label className="text-xs font-semibold text-slate-200">Total Omzet Penjualan (Rp) *</Label>
                <Input
                  type="number"
                  min={0}
                  step={100000}
                  required
                  value={formPeriod.totalRevenue}
                  onChange={(e) =>
                    setFormPeriod({ ...formPeriod, totalRevenue: parseFloat(e.target.value) || 0 })
                  }
                  className="text-xs font-semibold"
                />
              </div>

              <div className="sm:col-span-4 space-y-1">
                <Label className="text-xs font-semibold text-slate-200">Tanggal Mulai</Label>
                <Input
                  type="date"
                  value={formPeriod.startDate}
                  onChange={(e) => setFormPeriod({ ...formPeriod, startDate: e.target.value })}
                  className="text-xs"
                />
              </div>
              <div className="sm:col-span-4 space-y-1">
                <Label className="text-xs font-semibold text-slate-200">Tanggal Selesai</Label>
                <Input
                  type="date"
                  value={formPeriod.endDate}
                  onChange={(e) => setFormPeriod({ ...formPeriod, endDate: e.target.value })}
                  className="text-xs"
                />
              </div>
              <div className="sm:col-span-4 space-y-1">
                <Label className="text-xs font-semibold text-slate-200">COGS Teoritis POS (Rp) *</Label>
                <Input
                  type="number"
                  min={0}
                  step={50000}
                  required
                  value={formPeriod.theoreticalCOGS}
                  onChange={(e) =>
                    setFormPeriod({ ...formPeriod, theoreticalCOGS: parseFloat(e.target.value) || 0 })
                  }
                  className="text-xs font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Table Input */}
          <div className="bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-white/80 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between pb-1 border-b border-white/[0.08]/60">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-700" />
                Input Fisik Bahan Baku: (Awal + Beli) - Akhir = Pemakaian
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {formLogs.length} bahan baku terdaftar
              </span>
            </div>

            <div className="border border-white/85 rounded-xl overflow-x-auto max-h-60 overflow-y-auto bg-white/70 shadow-2xs">
              <Table>
                <TableHeader className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-white/[0.08]/70">
                  <TableRow>
                    <TableHead className="text-xs font-bold text-slate-200">Bahan Baku</TableHead>
                    <TableHead className="w-24 text-xs font-bold text-slate-200 text-right">Stok Awal</TableHead>
                    <TableHead className="w-24 text-xs font-bold text-slate-200 text-right">Beli Masuk</TableHead>
                    <TableHead className="w-24 text-xs font-bold text-slate-200 text-right">Stok Akhir</TableHead>
                    <TableHead className="w-24 text-xs font-bold text-slate-200 text-right">Resep POS</TableHead>
                    <TableHead className="text-right text-xs font-bold text-slate-200">Pakai Fisik</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formLogs.map((item, idx) => {
                    const rowCalc = formCalculation.items[idx];
                    return (
                      <TableRow key={item.ingredientId || idx} className="text-xs hover:bg-white/90">
                        <TableCell className="font-semibold text-white">
                          {item.name} <span className="text-[10px] text-slate-400 font-normal">({item.unit})</span>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            step={0.1}
                            className="h-8 text-xs text-right font-semibold"
                            value={item.beginningStock}
                            onChange={(e) =>
                              handleLogChange(idx, "beginningStock", parseFloat(e.target.value) || 0)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            step={0.1}
                            className="h-8 text-xs text-right font-semibold"
                            value={item.purchases}
                            onChange={(e) =>
                              handleLogChange(idx, "purchases", parseFloat(e.target.value) || 0)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            step={0.1}
                            className="h-8 text-xs text-right font-semibold"
                            value={item.endingStock}
                            onChange={(e) =>
                              handleLogChange(idx, "endingStock", parseFloat(e.target.value) || 0)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            step={0.1}
                            className="h-8 text-xs text-right font-semibold"
                            value={item.theoreticalUsage}
                            onChange={(e) =>
                              handleLogChange(idx, "theoreticalUsage", parseFloat(e.target.value) || 0)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right font-extrabold text-white">
                          {formatNumber(rowCalc?.actualUsage || 0)} <span className="text-[10px] font-normal text-slate-400">{item.unit}</span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Live Calculation Preview */}
          <div className="p-3.5 bg-white/70 backdrop-blur-md rounded-2xl border border-white/80 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs shadow-xs">
            <div className="p-2.5 bg-white/70 backdrop-blur-xs rounded-xl border border-white/80 shadow-2xs">
              <span className="text-slate-400 text-[11px]">Total COGS Aktual Fisik:</span>
              <div className="font-extrabold text-white text-sm mt-0.5">{formatIDR(formCalculation.totalActualCOGS)}</div>
            </div>
            <div className="p-2.5 bg-white/70 backdrop-blur-xs rounded-xl border border-white/80 shadow-2xs">
              <span className="text-slate-400 text-[11px]">COGS Teoritis POS:</span>
              <div className="font-extrabold text-white text-sm mt-0.5">{formatIDR(formPeriod.theoreticalCOGS)}</div>
            </div>
            <div className="p-2.5 bg-white/70 backdrop-blur-xs rounded-xl border border-white/80 shadow-2xs">
              <span className="text-slate-400 text-[11px]">Estimasi Selisih:</span>
              <div
                className={`font-extrabold text-sm mt-0.5 ${
                  formCalculation.varianceAmount > 0 ? "text-rose-700" : "text-emerald-700"
                }`}
              >
                {formatIDR(formCalculation.varianceAmount)} ({formatNumber(formCalculation.variancePercent, 1)}%)
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]/70">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="text-xs border-white/[0.12] bg-[#222226] hover:bg-[#2c2c31] min-h-[40px] px-4 font-semibold text-zinc-200"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={saving}
              variant="pill" className="text-xs font-black min-h-[40px] px-6 shadow-[0_4px_20px_rgba(255,255,255,0.2)]"
            >
              {saving ? "Menyimpan..." : "Simpan & Kunci Audit"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
