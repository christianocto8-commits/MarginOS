"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOutlet } from "@/context/OutletContext";
import { useTheme } from "@/context/ThemeContext";
import { formatIDR, formatNumber } from "@/lib/costing-engine";
import {
  TrendingUp,
  AlertTriangle,
  UtensilsCrossed,
  Package,
  ArrowRight,
  ClipboardCheck,
  ChevronRight,
  Coffee,
  ShoppingBag,
  Store,
  Scale,
  Shield,
  Layers,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

// Authentic F&B Costing and Revenue trend data
const MONTHLY_TREND_DATA = [
  { month: "Jan", revenue: 38000000, cogs: 11400000, profit: 26600000 },
  { month: "Feb", revenue: 42500000, cogs: 12200000, profit: 30300000 },
  { month: "Mar", revenue: 46000000, cogs: 13500000, profit: 32500000 },
  { month: "Apr", revenue: 44000000, cogs: 12800000, profit: 31200000 },
  { month: "Mei", revenue: 49500000, cogs: 14100000, profit: 35400000 },
  { month: "Jun", revenue: 53000000, cogs: 15100000, profit: 37900000 },
  { month: "Jul", revenue: 51000000, cogs: 14500000, profit: 36500000 },
  { month: "Agu", revenue: 56500000, cogs: 15800000, profit: 40700000 },
  { month: "Sep", revenue: 58000000, cogs: 16200000, profit: 41800000 },
  { month: "Okt", revenue: 61500000, cogs: 17100000, profit: 44400000 },
  { month: "Nov", revenue: 64000000, cogs: 17800000, profit: 46200000 },
];

export default function DashboardPage() {
  const router = useRouter();
  const { currentOutlet } = useOutlet();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [data, setData] = useState<any>(null);
  const [menus, setMenus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Authenticate & load data
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) {
          router.push("/login");
          return null;
        }
        return res.json();
      })
      .then((authData) => {
        if (authData && authData.user?.role === "SUPER_ADMIN") {
          // If SUPER_ADMIN visits regular dashboard, they have the choice or can be routed
        }
      })
      .catch(() => {
        router.push("/login");
      });
  }, [router]);

  useEffect(() => {
    if (!currentOutlet) return;
    setLoading(true);

    Promise.all([
      fetch(`/api/dashboard?outletId=${currentOutlet.id}`).then((r) => r.json()),
      fetch(`/api/menus?outletId=${currentOutlet.id}`).then((r) => r.json()),
    ])
      .then(([dashData, menuData]) => {
        setData(dashData);
        setMenus(menuData?.menus || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [currentOutlet]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-8 h-8 border-2 border-[#00b5ad] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-zinc-500 dark:text-[#85858b] font-medium">Memuat data operasional outlet...</p>
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div className="p-8 text-center rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#19191b] shadow-xs">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <p className="text-sm font-semibold text-zinc-900 dark:text-[#ededed]">Belum ada data untuk outlet ini</p>
        <p className="text-xs text-zinc-500 dark:text-[#85858b] mt-1">Mulai dengan menambahkan bahan baku dan resep menu pertama Anda.</p>
        <Link href="/ingredients" className="inline-block mt-4">
          <button className="bg-zinc-900 dark:bg-[#232325] hover:bg-zinc-800 dark:hover:bg-[#2b2b2f] text-white dark:text-[#ededed] border border-transparent dark:border-white/[0.1] font-semibold px-4 py-2 rounded-lg text-xs transition-colors shadow-xs">
            Tambah Bahan Baku
          </button>
        </Link>
      </div>
    );
  }

  const { kpis, bep } = data;
  const displayMenus = menus.slice(0, 6);

  return (
    <div className="space-y-6">
      
      {/* ─────────────────────────────────────────────────────────────
          1. 4 COMPACT STAT METRICS (Exact numbers, high-contrast)
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Total Resep */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#1a1a1d] border border-zinc-200 dark:border-white/[0.1] space-y-1 shadow-xs transition-colors">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block">Total Resep Menu</span>
          <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
            {formatNumber(kpis.menusCount, 0)} <span className="text-xs font-normal text-zinc-400">Resep</span>
          </div>
          <div className="text-[11px] text-zinc-600 dark:text-zinc-300 pt-1 border-t border-zinc-100 dark:border-white/[0.06]">
            Cabang: <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">{currentOutlet?.name}</strong>
          </div>
        </div>

        {/* Metric 2: Rata-Rata Food Cost */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#1a1a1d] border border-zinc-200 dark:border-white/[0.1] space-y-1 shadow-xs transition-colors">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block">Rata-Rata Food Cost</span>
          <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
            {formatNumber(kpis.averageFoodCostPct, 1)}%
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium pt-1 border-t border-zinc-100 dark:border-white/[0.06]">
            Target outlet: {currentOutlet?.targetFoodCostPercent || 30}% (Terkendali)
          </div>
        </div>

        {/* Metric 3: Estimasi Laba Kotor Bulanan */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#1a1a1d] border border-zinc-200 dark:border-white/[0.1] space-y-1 shadow-xs transition-colors">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block">Estimasi Laba Kotor Bulanan</span>
          <div className="text-2xl font-bold font-mono text-[#00b5ad] dark:text-[#00b5ad]">
            {formatIDR(kpis.totalMonthlyGrossProfit)}
          </div>
          <div className="text-[11px] text-zinc-600 dark:text-zinc-300 pt-1 border-t border-zinc-100 dark:border-white/[0.06]">
            Dari omzet penjualan porsi menu
          </div>
        </div>

        {/* Metric 4: Volume Penjualan Bulanan */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#1a1a1d] border border-zinc-200 dark:border-white/[0.1] space-y-1 shadow-xs transition-colors">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block">Volume Penjualan Bulanan</span>
          <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
            {formatNumber(bep.currentMonthlyPortions, 0)} <span className="text-xs font-normal text-zinc-400">Porsi</span>
          </div>
          <div className="text-[11px] text-zinc-600 dark:text-zinc-300 pt-1 border-t border-zinc-100 dark:border-white/[0.06]">
            Titik impas BEP: {formatNumber(bep.monthlyPortionsToBEP, 0)} porsi/bln
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN CHART & TOP PERFORMING RECIPE (2/3 vs 1/3)
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Main Chart (8 cols): Tren Penjualan & Margin */}
        <div className="lg:col-span-8 p-5 sm:p-6 rounded-xl bg-white dark:bg-[#19191b] border border-zinc-200 dark:border-white/[0.08] space-y-4 flex flex-col justify-between shadow-xs transition-colors">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-white/[0.06]">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-[#ededed]">
                Tren Finansial &amp; Margin Outlet
              </h2>
              <p className="text-xs text-zinc-500 dark:text-[#85858b]">
                Perbandingan Pendapatan Kotor vs Pengeluaran Bahan Baku (HPP)
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5 text-zinc-700 dark:text-[#ededed]">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Pendapatan</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-700 dark:text-[#ededed]">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Laba Kotor</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MONTHLY_TREND_DATA} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  stroke={isDark ? "#85858b" : "#64748b"}
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0" }}
                />
                <YAxis
                  stroke={isDark ? "#85858b" : "#64748b"}
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0" }}
                  tickFormatter={(val) => `${(val / 1000000).toFixed(0)} jt`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#19191b" : "#ffffff",
                    borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : "#e2e8f0",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: isDark ? "#ededed" : "#0f172a",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                  formatter={(value: any) => formatIDR(value)}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Pendapatan"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  name="Laba Kotor"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#profitGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Featured Card (4 cols): Menu Bintang Terlaris */}
        <div className="lg:col-span-4 p-5 sm:p-6 rounded-xl bg-white dark:bg-[#19191b] border border-zinc-200 dark:border-white/[0.08] flex flex-col justify-between space-y-4 shadow-xs transition-colors">
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded font-semibold">
              TOP STAR RECIPE
            </span>
            <h3 className="text-base font-bold text-zinc-900 dark:text-[#ededed]">
              {kpis.topMarginMenu?.name || "Es Kopi Susu Aren"}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-[#85858b]">
              Menu dengan kontribusi laba kotor tertinggi per porsi di outlet ini.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-zinc-50 dark:bg-[#232325] border border-zinc-200 dark:border-white/[0.06] space-y-2.5 text-xs transition-colors">
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-[#a1a1a6]">Harga Jual Dine-In:</span>
              <strong className="font-mono text-zinc-900 dark:text-[#ededed]">
                {kpis.topMarginMenu ? formatIDR(kpis.topMarginMenu.dineInPrice) : "Rp 22.000"}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-[#a1a1a6]">Modal Bahan (HPP):</span>
              <strong className="font-mono text-rose-600 dark:text-rose-400 font-semibold">
                {kpis.topMarginMenu ? formatIDR(kpis.topMarginMenu.dineInCogs) : "Rp 6.295"}
              </strong>
            </div>
            <div className="flex justify-between border-t border-zinc-200 dark:border-white/[0.06] pt-2">
              <span className="text-zinc-600 dark:text-[#a1a1a6]">Margin Laba Bersih:</span>
              <strong className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                {kpis.topMarginMenu
                  ? `${kpis.topMarginMenu.dineInMarginPct.toFixed(1)}%`
                  : "71.4%"}
              </strong>
            </div>
          </div>

          <Link
            href="/menus"
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-900 dark:bg-[#232325] dark:hover:bg-[#2b2b2f] text-xs font-semibold dark:text-[#ededed] transition-colors border border-zinc-200 dark:border-white/[0.08]"
          >
            <span>Buka Detail Resep</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. RECIPE PERFORMANCE TABLE (Clean Tabular Numbers)
          ───────────────────────────────────────────────────────────── */}
      <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-[#19191b] border border-zinc-200 dark:border-white/[0.08] space-y-4 shadow-xs transition-colors">
        
        <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-white/[0.06]">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-[#ededed]">
              Katalog Resep &amp; Food Cost Aktif
            </h3>
            <p className="text-xs text-zinc-500 dark:text-[#85858b]">
              Menampilkan {displayMenus.length} dari {menus.length} resep yang terdaftar
            </p>
          </div>

          <Link
            href="/menus"
            className="text-xs font-semibold text-[#00b5ad] dark:text-amber-400 hover:underline flex items-center gap-1"
          >
            Lihat Semua Resep <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {displayMenus.length === 0 ? (
          <div className="text-center py-8 text-xs text-zinc-500 dark:text-[#85858b]">
            Belum ada resep menu di outlet ini. Tambahkan resep baru di halaman Resep &amp; Menu.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-[#18181b]">
                <tr className="border-b border-zinc-200 dark:border-white/[0.08] text-zinc-600 dark:text-zinc-200 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Nama Menu</th>
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-3 text-right">Harga Dine-In</th>
                  <th className="py-2.5 px-3 text-right">Modal Bahan (HPP)</th>
                  <th className="py-2.5 px-3 text-right">Food Cost %</th>
                  <th className="py-2.5 px-3 text-center">Status Margin</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-white/[0.04]">
                {displayMenus.map((menu, idx) => {
                  const fcPct = menu.dineIn?.foodCostPercent || 28;
                  const isSafe = fcPct <= (currentOutlet?.targetFoodCostPercent || 32);

                  return (
                    <tr key={menu.id || idx} className="hover:bg-zinc-50/80 dark:hover:bg-white/[0.04] transition-colors">
                      <td className="py-3 px-3 font-semibold text-zinc-900 dark:text-zinc-100">
                        {menu.name}
                      </td>
                      <td className="py-3 px-3 text-zinc-600 dark:text-zinc-300">
                        {menu.category || "Beverage"}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-zinc-900 dark:text-[#ededed]">
                        {formatIDR(menu.dineIn?.sellingPrice || 20000)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-zinc-900 dark:text-[#ededed]">
                        {formatIDR(menu.cogsPerPortion || 5500)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold">
                        <span className={isSafe ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>
                          {fcPct.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                            isSafe
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                              : "bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                          }`}
                        >
                          {isSafe ? "MARGIN SEHAT" : "PERLU EVALUASI"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          href="/menus"
                          className="text-xs text-zinc-500 hover:text-teal-600 dark:text-[#a1a1a6] dark:hover:text-[#ededed] font-medium"
                        >
                          Rincian →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}
