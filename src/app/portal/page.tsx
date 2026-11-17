"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOutlet } from "@/context/OutletContext";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  Store,
  ShoppingCart,
  Layers,
  Settings,
  TrendingUp,
  LogOut,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Shield,
  ChefHat,
  Users,
  Printer,
  Calculator,
  PieChart,
  Crown,
  Coffee,
  CheckCircle2,
} from "lucide-react";

export default function PortalHubPage() {
  const router = useRouter();
  const { outlets, currentOutlet, setCurrentOutlet } = useOutlet();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) {
          router.push("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.authenticated) {
          setSession(data);
        } else {
          router.push("/login");
        }
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0f1013] flex flex-col items-center justify-center space-y-3">
        <div className="w-9 h-9 border-2 border-[#00b5ad] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Memuat portal modul MarginOS...</p>
      </div>
    );
  }

  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  return (
    <div className="min-h-screen bg-[#f8f9fb] dark:bg-[#0d0e12] text-zinc-900 dark:text-[#ededed] flex flex-col font-sans transition-colors duration-200">
      
      {/* ─────────────────────────────────────────────────────────────
          TOP APP BAR / HEADER
          ───────────────────────────────────────────────────────────── */}
      <header className="h-16 px-4 sm:px-8 border-b border-zinc-200 dark:border-white/[0.08] bg-white/90 dark:bg-[#14151a]/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between transition-colors">
        
        {/* Brand & Active Outlet Indicator */}
        <div className="flex items-center gap-3 sm:gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00b5ad] to-teal-400 text-white flex items-center justify-center font-black text-sm shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
              M
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-zinc-900 dark:text-white block leading-none">
                Margin<span className="text-zinc-400 dark:text-zinc-500 font-normal">OS</span>
              </span>
              <span className="text-[10px] font-mono tracking-wider text-[#00b5ad] font-semibold uppercase">
                App Portal Hub
              </span>
            </div>
          </Link>

          {/* Outlet Selector Dropdown */}
          {outlets.length > 0 && (
            <div className="hidden md:flex items-center gap-2 pl-4 border-l border-zinc-200 dark:border-white/[0.08]">
              <Store className="w-3.5 h-3.5 text-[#00b5ad]" />
              <select
                value={currentOutlet?.id || ""}
                onChange={(e) => {
                  const target = outlets.find((o) => o.id === e.target.value);
                  if (target) setCurrentOutlet(target);
                }}
                className="h-8 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-white/[0.12] bg-zinc-50 dark:bg-[#1b1c22] text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-[#00b5ad] cursor-pointer"
              >
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right Actions: User info, Theme Toggle & Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle variant="icon" />

          {/* User Profile Pill */}
          <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-zinc-200 dark:border-white/[0.08]">
            <div className="w-8 h-8 rounded-full bg-teal-500/10 border border-teal-500/20 text-[#00b5ad] font-bold text-xs flex items-center justify-center uppercase">
              {session?.user?.name ? session.user.name.charAt(0) : "U"}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                {session?.user?.name || "Operator"}
              </p>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-white/[0.08] text-zinc-600 dark:text-zinc-300 font-semibold uppercase">
                {session?.user?.role || "USER"}
              </span>
            </div>
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="p-2 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Keluar Akun"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          MAIN CONTENT / MODULE LAUNCHPAD
          ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 lg:p-12 space-y-8 sm:space-y-10">
        
        {/* Welcome Banner & Subheader */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/20 text-xs font-semibold text-teal-800 dark:text-teal-300">
            <Sparkles className="w-3.5 h-3.5 text-[#00b5ad]" />
            <span>Pusat Kendali Operasional Resto &amp; Kafe</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                Selamat Datang,{" "}
                <span className="text-[#00b5ad]">{session?.user?.name?.split(" ")[0] || "Operator"}</span>!
              </h1>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-2xl">
                Silakan pilih modul kerja yang ingin Anda buka untuk outlet{" "}
                <strong className="text-zinc-900 dark:text-zinc-200 font-semibold">{currentOutlet?.name || "Cabang Utama"}</strong>.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono bg-white dark:bg-[#15161c] border border-zinc-200 dark:border-white/[0.08] px-3.5 py-2 rounded-xl shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-zinc-500 dark:text-zinc-400">Target Food Cost:</span>
              <strong className="text-zinc-900 dark:text-white">{currentOutlet?.targetFoodCostPercent || 30}%</strong>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            PRIMARY MODULE SELECTION GRID (POS, BACK OFFICE, SETTINGS, FINANCIALS)
            ───────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* 1. POS (POINT OF SALE) */}
          <div className="group relative rounded-2xl bg-white dark:bg-[#15161c] border border-zinc-200 dark:border-white/[0.08] hover:border-[#00b5ad]/60 dark:hover:border-[#00b5ad]/60 p-6 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl group-hover:bg-teal-500/10 transition-colors pointer-events-none" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/20 text-[#00b5ad] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                  Operasional Kasir
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white group-hover:text-[#00b5ad] transition-colors">
                  Point of Sale (POS)
                </h3>
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Terminal Kasir &amp; Transaksi Cepat
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                  Sistem kasir layar sentuh untuk pesanan Dine-In, Takeaway &amp; Delivery. Cetak struk kasir, hitung otomatis pajak PB1 (10%) &amp; service charge, serta proses pembayaran QRIS &amp; Tunai.
                </p>
              </div>

              {/* Feature Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-300">
                  ⚡ Kasir Cepat
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-300">
                  🧾 Struk Thermal
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-300">
                  💳 QRIS / Cash / Debit
                </span>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-zinc-100 dark:border-white/[0.06]">
              <Link
                href="/pos"
                className="w-full h-10 rounded-xl bg-[#00b5ad] hover:bg-teal-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-teal-500/20 transition-all group-hover:translate-x-0.5"
              >
                <span>Buka Terminal Kasir POS</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* 2. BACK OFFICE & KITCHEN COSTING */}
          <div className="group relative rounded-2xl bg-white dark:bg-[#15161c] border border-zinc-200 dark:border-white/[0.08] hover:border-amber-500/60 dark:hover:border-amber-500/60 p-6 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors pointer-events-none" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Layers className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                  Costing &amp; Dapur
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Back Office &amp; Dapur
                </h3>
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Food Costing, Resep &amp; Inventori
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                  Pusat kendali HPP dan bahan baku F&amp;B. Hitung modal porsi dengan susut pembersihan (yield), kelola katalog resep, input belanja restock (PO), dan audit stok opname COGS.
                </p>
              </div>

              {/* Feature Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-300">
                  🍳 Resep &amp; Sub-Resep
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-300">
                  ⚖️ HPP &amp; Yield Susut
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-300">
                  📦 Stok Opname COGS
                </span>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-zinc-100 dark:border-white/[0.06]">
              <Link
                href="/dashboard"
                className="w-full h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all group-hover:translate-x-0.5"
              >
                <span>Buka Back Office &amp; Dapur</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* 3. SETTINGS & CONFIGURATION */}
          <div className="group relative rounded-2xl bg-white dark:bg-[#15161c] border border-zinc-200 dark:border-white/[0.08] hover:border-zinc-500/60 dark:hover:border-zinc-400/60 p-6 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-500/5 rounded-full blur-2xl group-hover:bg-zinc-500/10 transition-colors pointer-events-none" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-white/[0.08] border border-zinc-200 dark:border-white/[0.12] text-zinc-700 dark:text-zinc-200 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Settings className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-white/[0.08] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/[0.1]">
                  Konfigurasi
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors">
                  Pengaturan (Setting)
                </h3>
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Outlet, Staf, Pajak &amp; Sistem
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                  Pengaturan komprehensif cabang dan outlet, penambahan akun staf dengan pembagian hak akses (Owner, Manager, Chef, Kasir), printer thermal, dan konfigurasi pajak PB1.
                </p>
              </div>

              {/* Feature Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-300">
                  🏬 Multi-Cabang Outlet
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-300">
                  👥 Hak Akses Staf (RBAC)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-300">
                  🖨️ Printer &amp; Pajak PB1
                </span>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-zinc-100 dark:border-white/[0.06]">
              <Link
                href="/settings"
                className="w-full h-10 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#20222a] dark:hover:bg-[#282a34] text-zinc-900 dark:text-white font-bold text-xs flex items-center justify-center gap-2 border border-zinc-200 dark:border-white/[0.1] transition-all group-hover:translate-x-0.5"
              >
                <span>Buka Pengaturan Sistem</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* 4. LAPORAN & ANALITIK (DAN LAIN-LAIN) */}
          <div className="group relative rounded-2xl bg-white dark:bg-[#15161c] border border-zinc-200 dark:border-white/[0.08] hover:border-sky-500/60 dark:hover:border-sky-500/60 p-6 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl group-hover:bg-sky-500/10 transition-colors pointer-events-none" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-500/20">
                  Laporan &amp; BEP
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                  Laporan &amp; Finansial
                </h3>
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Laba Rugi, BEP &amp; Matriks Menu
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                  Pantau performa keuntungan bersih outlet dengan Laporan Laba Rugi (P&amp;L), analisis Matriks Boston Box (Menu Bintang vs Anjing Beban), dan kalkulator titik impas (BEP) bulanan.
                </p>
              </div>

              {/* Feature Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-300">
                  📊 Laba Rugi (P&amp;L)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-300">
                  🎯 Matriks Menu Boston
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-300">
                  📈 Titik Impas BEP
                </span>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-zinc-100 dark:border-white/[0.06]">
              <Link
                href="/financials"
                className="w-full h-10 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#20222a] dark:hover:bg-[#282a34] text-zinc-900 dark:text-white font-bold text-xs flex items-center justify-center gap-2 border border-zinc-200 dark:border-white/[0.1] transition-all group-hover:translate-x-0.5"
              >
                <span>Lihat Laporan Finansial</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* 5. SUPER ADMIN (Conditional) */}
          {isSuperAdmin && (
            <div className="group relative rounded-2xl bg-white dark:bg-[#15161c] border border-amber-500/30 p-6 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shadow-xs">
                    <Crown className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Platform Owner
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                    Super Admin Console
                  </h3>
                  <p className="text-xs font-semibold text-amber-500 mt-0.5">
                    Multi-Tenant &amp; Platform SaaS
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                    Manajemen seluruh tenant bisnis F&amp;B yang terdaftar, pantau MRR langganan, aktivasi lisensi, audit sistem, dan impersonasi akun pengguna.
                  </p>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-zinc-100 dark:border-white/[0.06]">
                <Link
                  href="/super-admin"
                  className="w-full h-10 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <span>Buka Konsol Super Admin</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

        </div>

        {/* ─────────────────────────────────────────────────────────────
            QUICK ACCESS SHORTCUTS
            ───────────────────────────────────────────────────────────── */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#15161c] border border-zinc-200 dark:border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-white/[0.06]">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                Akses Pintas Cepat (Quick Shortcuts)
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Fitur operasional praktis yang sering diakses setiap hari
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              href="/quick-calc"
              className="p-3.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 dark:bg-[#1c1d24] dark:hover:bg-[#242630] border border-zinc-200 dark:border-white/[0.06] transition-colors flex items-center gap-3"
            >
              <Calculator className="w-4 h-4 text-[#00b5ad]" />
              <div className="truncate">
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">Kalkulator HPP</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">Hitung cepat modal</p>
              </div>
            </Link>

            <Link
              href="/pricing-simulator"
              className="p-3.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 dark:bg-[#1c1d24] dark:hover:bg-[#242630] border border-zinc-200 dark:border-white/[0.06] transition-colors flex items-center gap-3"
            >
              <Coffee className="w-4 h-4 text-amber-500" />
              <div className="truncate">
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">Simulator Ojol</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">Mark-up komisi 20%</p>
              </div>
            </Link>

            <Link
              href="/sop-export"
              className="p-3.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 dark:bg-[#1c1d24] dark:hover:bg-[#242630] border border-zinc-200 dark:border-white/[0.06] transition-colors flex items-center gap-3"
            >
              <Printer className="w-4 h-4 text-sky-500" />
              <div className="truncate">
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">Cetak SOP Dapur</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">Lembar resep koki</p>
              </div>
            </Link>

            <Link
              href="/purchases"
              className="p-3.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 dark:bg-[#1c1d24] dark:hover:bg-[#242630] border border-zinc-200 dark:border-white/[0.06] transition-colors flex items-center gap-3"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <div className="truncate">
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">Belanja Bahan PO</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">Input nota supplier</p>
              </div>
            </Link>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-zinc-200 dark:border-white/[0.06] text-center text-xs text-zinc-500 dark:text-zinc-500">
        MarginOS F&amp;B Operating System • Presisi HPP, Kasir POS &amp; Profit Maksimal
      </footer>

    </div>
  );
}