"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatIDR } from "@/lib/costing-engine";
import {
  ArrowRight,
  Shield,
  Scale,
  ChefHat,
  ChevronDown,
  Globe,
  Check,
  Coffee,
  Flame,
  Croissant,
  UtensilsCrossed,
  Store,
  Receipt,
  Plus,
  Minus,
  LayoutDashboard,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function RootLandingPage() {
  // Authentication check for visitor
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.authenticated) {
          setSession(data);
        }
      })
      .catch(() => {});
  }, []);

  // Simulator State
  const [sellingPrice, setSellingPrice] = useState(22000);
  const [foodCost, setFoodCost] = useState(5800);
  const [packagingCost, setPackagingCost] = useState(1500);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Math
  const dineInProfit = sellingPrice - foodCost;
  const dineInMarginPct = sellingPrice > 0 ? (dineInProfit / sellingPrice) * 100 : 0;
  const foodCostPct = sellingPrice > 0 ? (foodCost / sellingPrice) * 100 : 0;

  // Online Food Delivery (OFD) math: 20% platform cut + Rp 1.000 fixed fee
  const commissionDeduction = sellingPrice * 0.2 + 1000;
  const onlineProfit = sellingPrice - commissionDeduction - (foodCost + packagingCost);
  const suggestedOnlinePrice = Math.round(((sellingPrice + packagingCost + 1000) / 0.8) / 500) * 500;
  const suggestedProfit = suggestedOnlinePrice * 0.8 - 1000 - (foodCost + packagingCost);

  const presets = [
    { name: "Es Kopi Susu Aren", price: 20000, fc: 5200, pack: 1800, icon: Coffee, tag: "Coffee & Beverage" },
    { name: "Ayam Geprek Sambal", price: 24000, fc: 8500, pack: 2200, icon: Flame, tag: "Kitchen & Savory" },
    { name: "Butter Croissant", price: 28000, fc: 9400, pack: 1500, icon: Croissant, tag: "Bakery & Pastry" },
    { name: "Mie Ayam Jamur", price: 25000, fc: 7900, pack: 2500, icon: UtensilsCrossed, tag: "Noodle & Bowls" },
  ];

  const faqs = [
    {
      q: "Apakah MarginOS dapat digunakan langsung dari smartphone staf di dapur?",
      a: "Bisa 100%. MarginOS didesain dengan antarmuka mobile-first. Barista dan koki dapat membuka lembar SOP resep langsung dari layar ponsel tanpa perlu membawa laptop ke area basah dapur.",
    },
    {
      q: "Bagaimana cara MarginOS menghitung susut bahan baku (Yield)?",
      a: "Anda cukup memasukkan harga beli supplier dan persentase yield bersih. Contoh: 1 kg ayam utuh Rp 35.000 dengan yield 75% setelah dibersihkan tulang dan lemak. MarginOS otomatis menghitung modal bersih daging siap olah menjadi Rp 46,67/gr, bukan Rp 35/gr.",
    },
    {
      q: "Apakah rahasia harga beli bahan baku aman saat staf melihat resep?",
      a: "Sangat aman. MarginOS memiliki mode 'Cetak SOP Dapur' yang khusus menampilkan gramasi dan takaran memasak tanpa memunculkan rahasia harga beli supplier kepada staf koki atau barista.",
    },
    {
      q: "Apakah saya perlu kartu kredit untuk mencoba MarginOS?",
      a: "Tidak perlu. Anda dapat langsung mendaftar uji coba gratis 14 hari tanpa kartu kredit. Pembayaran langganan resmi mendukung QRIS, GoPay, OVO, dan Virtual Account bank lokal.",
    },
  ];

  const dashboardHref = session?.user?.role === "SUPER_ADMIN" ? "/super-admin" : "/portal";

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#1c1917] font-sans selection:bg-amber-500/20 selection:text-amber-950">
      
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER / NAVBAR (Simple, Quiet, Clean)
          ───────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#faf8f5]/85 backdrop-blur-md border-b border-[#e7e2da]">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 py-4 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1c1917] text-amber-50 flex items-center justify-center font-mono font-bold text-sm">
              M
            </div>
            <span className="font-bold text-lg tracking-tight text-[#1c1917]">
              Margin<span className="font-normal text-[#78716c]">OS</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-[13px] font-medium text-[#78716c]">
            <a href="#hero" className="text-[#1c1917] font-semibold">
              Ringkasan
            </a>
            <a href="#simulator" className="hover:text-[#1c1917] transition-colors">
              Simulator Ojol
            </a>
            <a href="#features" className="hover:text-[#1c1917] transition-colors">
              Fitur Utama
            </a>
            <a href="#pricing" className="hover:text-[#1c1917] transition-colors">
              Paket Harga
            </a>
            <a href="#faq" className="hover:text-[#1c1917] transition-colors">
              FAQ
            </a>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle variant="icon" />

            <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-[#78716c] bg-white px-3 py-1.5 rounded-lg border border-[#e7e2da]">
              <Globe className="w-3.5 h-3.5 text-[#a8a29e]" />
              <span>IDR (Rp)</span>
              <ChevronDown className="w-3 h-3 text-[#a8a29e]" />
            </div>

            {session ? (
              <Link
                href={dashboardHref}
                className="text-xs font-semibold px-4 py-2 rounded-lg bg-[#1c1917] hover:bg-[#292524] text-white transition-colors shadow-xs flex items-center gap-2"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-[#00b5ad]" />
                <span>Buka Menu Modul ({session.user.name?.split(" ")[0] || "Akun"})</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs font-semibold px-3.5 py-2 rounded-lg border border-[#d6d0c4] text-[#1c1917] hover:bg-white transition-colors"
                >
                  Masuk
                </Link>

                <Link
                  href="/register"
                  className="text-xs font-semibold px-4 py-2 rounded-lg bg-[#1c1917] hover:bg-[#292524] text-white transition-colors shadow-xs"
                >
                  Coba Gratis 14 Hari
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. HERO SECTION (Simple, Elegant & Visually Appreciable)
          ───────────────────────────────────────────────────────────── */}
      <section id="hero" className="pt-32 sm:pt-40 pb-16 px-6 sm:px-12 lg:px-20 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          
          {/* Left Column: Clear Purpose & Typography */}
          <div className="lg:col-span-6 space-y-6">
            
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white border border-[#e7e2da] text-xs font-semibold text-[#78716c]">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              Sistem Operasional HPP Kuliner &amp; Kafe
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight text-[#1c1917] leading-[1.12]">
              Presisi HPP Resep. <br />
              <span className="font-serif italic font-normal text-[#78716c]">Laba Pasti</span> di Setiap Porsi.
            </h1>

            <p className="text-sm sm:text-base text-[#57534e] font-normal leading-relaxed max-w-lg">
              MarginOS mengalkulasi modal bahan mentah, susut pembersihan (yield), dan potongan komisi aplikasi ojol secara otomatis. Tidak ada lagi margin bocor atau tebak-tebakan harga menu.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {session ? (
                <Link
                  href={dashboardHref}
                  className="rounded-lg bg-[#1c1917] hover:bg-[#292524] text-white font-semibold text-xs sm:text-sm px-6 py-3.5 transition-colors flex items-center gap-2 shadow-xs"
                >
                  <span>Masuk ke Portal Aplikasi</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="rounded-lg bg-[#1c1917] hover:bg-[#292524] text-white font-semibold text-xs sm:text-sm px-6 py-3.5 transition-colors flex items-center gap-2 shadow-xs"
                  >
                    <span>Mulai Coba Gratis</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href="/login"
                    className="rounded-lg bg-white border border-[#d6d0c4] hover:bg-[#f5f2eb] text-[#1c1917] font-semibold text-xs sm:text-sm px-5 py-3.5 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span>Masuk ke Akun</span>
                  </Link>
                </>
              )}

              <button
                onClick={() => {
                  const el = document.getElementById("simulator");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="rounded-lg bg-transparent hover:bg-black/[0.04] text-[#57534e] font-semibold text-xs sm:text-sm px-4 py-3.5 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Buka Simulator Ojol ↓</span>
              </button>
            </div>

            {/* 3 Simple Metrics */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#e7e2da] max-w-lg">
              <div>
                <div className="text-xl font-bold font-mono text-[#1c1917]">0,1 gr</div>
                <div className="text-[11px] text-[#78716c] mt-0.5">Akurasi Gramasi &amp; Susut</div>
              </div>
              <div>
                <div className="text-xl font-bold font-mono text-emerald-700">20% + 1k</div>
                <div className="text-[11px] text-[#78716c] mt-0.5">Proteksi Komisi Ojol</div>
              </div>
              <div>
                <div className="text-xl font-bold font-mono text-[#1c1917]">100%</div>
                <div className="text-[11px] text-[#78716c] mt-0.5">SOP Dapur Bebas Bocor</div>
              </div>
            </div>

          </div>

          {/* Right Column: Clear, Prominent Culinary Showcase with Floating Recipe Callouts */}
          <div className="lg:col-span-6 relative">
            
            {/* Visual Frame: Clear View of High-Res Artisanal Coffee & Culinary Prep Counter */}
            <div className="relative rounded-2xl overflow-hidden shadow-xl border border-black/[0.08] bg-[#1c1917] aspect-[4/3] sm:aspect-[16/11]">
              <img
                src="/hero-culinary.jpg"
                alt="Artisanal cafe and culinary preparation counter with latte art and precision coffee scale"
                className="w-full h-full object-cover object-center filter brightness-[0.98] contrast-[1.03]"
              />

              {/* Gentle bottom shade for overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

              {/* Floating Badge Top Left: Culinary Category */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-medium">
                <Coffee className="w-3.5 h-3.5 text-amber-300" />
                <span>Specialty Coffee &amp; Beverage Station</span>
              </div>

              {/* Floating Pill Top Right: Accuracy badge */}
              <div className="absolute top-4 right-4 z-20 hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-md text-[#1c1917] text-xs font-semibold shadow-md">
                <Scale className="w-3.5 h-3.5 text-emerald-700" />
                <span>Yield Presisi 100%</span>
              </div>

              {/* Floating Bottom Card: Real Culinary Costing Ticket */}
              <div className="absolute bottom-4 left-4 right-4 z-20 bg-white/95 backdrop-blur-md rounded-xl p-3.5 sm:p-4 border border-white shadow-xl">
                <div className="flex items-center justify-between pb-2 border-b border-black/[0.06]">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-amber-700" />
                    <span className="font-bold text-xs sm:text-sm text-[#1c1917]">Es Kopi Susu Gula Aren 250ml</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    MARGIN 71.4%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2.5 text-xs">
                  <div>
                    <span className="text-[10px] text-[#78716c] block">Modal Bahan (HPP)</span>
                    <strong className="font-mono text-[#1c1917]">Rp 6.295</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#78716c] block">Harga Dine-In</span>
                    <strong className="font-mono text-[#1c1917]">Rp 22.000</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-700 font-semibold block">Rekomendasi Ojol</span>
                    <strong className="font-mono text-emerald-700 font-bold">Rp 28.500</strong>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. CULINARY FOCUS (3 Essential Food & Beverage Sectors)
          ───────────────────────────────────────────────────────────── */}
      <section className="py-16 px-6 sm:px-12 lg:px-20 max-w-7xl mx-auto border-t border-[#e7e2da]">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1c1917] tracking-tight">
            Dibuat untuk Segala Jenis Bisnis Kuliner
          </h2>
          <p className="text-xs sm:text-sm text-[#78716c]">
            Fleksibel untuk kedai kopi independen, artisan bakery, hingga jaringan resto dengan menu terstandar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Sector 1: Coffee & Beverages */}
          <div className="bg-white rounded-2xl p-6 border border-[#e7e2da] shadow-xs space-y-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/60 flex items-center justify-center">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#1c1917] text-base">Kedai Kopi &amp; Minuman Kekinian</h3>
              <p className="text-xs text-[#57534e] mt-1.5 leading-relaxed">
                Hitung takaran espresso (18g), sirup per ml, fresh milk, hingga biaya kemasan cup PET dan sedotan dengan akurasi tinggi.
              </p>
            </div>
            <div className="pt-3 border-t border-[#f5f2eb] flex items-center justify-between text-xs text-[#78716c]">
              <span>Rata-rata Food Cost:</span>
              <strong className="text-emerald-700 font-mono">24% – 28%</strong>
            </div>
          </div>

          {/* Sector 2: Bakery & Pastry */}
          <div className="bg-white rounded-2xl p-6 border border-[#e7e2da] shadow-xs space-y-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/60 flex items-center justify-center">
              <Croissant className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#1c1917] text-base">Bakery, Pastry &amp; Dessert</h3>
              <p className="text-xs text-[#57534e] mt-1.5 leading-relaxed">
                Kalkulasi adonan batch besar, biaya butter impor, dan konversi susut pemanggangan oven per loyang hidangan.
              </p>
            </div>
            <div className="pt-3 border-t border-[#f5f2eb] flex items-center justify-between text-xs text-[#78716c]">
              <span>Margin Laba Sehat:</span>
              <strong className="text-emerald-700 font-mono">65% – 72%</strong>
            </div>
          </div>

          {/* Sector 3: Restaurant & Kitchen */}
          <div className="bg-white rounded-2xl p-6 border border-[#e7e2da] shadow-xs space-y-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/60 flex items-center justify-center">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#1c1917] text-base">Restoran &amp; Cloud Kitchen</h3>
              <p className="text-xs text-[#57534e] mt-1.5 leading-relaxed">
                Hitung susut pembersihan ayam, daging, dan sayuran mentah (yield) serta formula markup komisi ojol agar tidak tekor.
              </p>
            </div>
            <div className="pt-3 border-t border-[#f5f2eb] flex items-center justify-between text-xs text-[#78716c]">
              <span>Proteksi Komisi Ojol:</span>
              <strong className="text-emerald-700 font-mono">Otomatis Aktif</strong>
            </div>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. INTERACTIVE SIMULATOR (Dine-In vs Ojol Anti-Tekor)
          ───────────────────────────────────────────────────────────── */}
      <section id="simulator" className="py-20 px-6 sm:px-12 lg:px-20 bg-white border-t border-[#e7e2da]">
        <div className="max-w-6xl mx-auto space-y-10">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1c1917] tracking-tight">
              Simulator Laba Bersih &amp; Komisi Pesan-Antar
            </h2>
            <p className="text-xs sm:text-sm text-[#78716c]">
              Pilih menu contoh di bawah atau sesuaikan slider untuk melihat perbedaan laba bersih Dine-in vs Aplikasi Ojol (GoFood/Grab/Shopee).
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {presets.map((p, idx) => {
              const Icon = p.icon;
              const isSelected = p.price === sellingPrice && p.fc === foodCost;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setSellingPrice(p.price);
                    setFoodCost(p.fc);
                    setPackagingCost(p.pack);
                  }}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? "bg-[#1c1917] text-white shadow-xs"
                      : "bg-[#faf8f5] text-[#57534e] hover:bg-[#f5f2eb] border border-[#e7e2da]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{p.name}</span>
                </button>
              );
            })}
          </div>

          {/* Simulator Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Input Sliders */}
            <div className="lg:col-span-5 bg-[#faf8f5] p-6 rounded-2xl border border-[#e7e2da] space-y-5">
              <h3 className="font-bold text-[#1c1917] text-sm">Parameter Biaya Menu</h3>

              {/* Slider 1: Harga Jual */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-[#57534e]">Harga Jual Dine-In:</span>
                  <span className="font-mono font-bold text-[#1c1917]">{formatIDR(sellingPrice)}</span>
                </div>
                <input
                  type="range"
                  min={10000}
                  max={100000}
                  step={1000}
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Number(e.target.value))}
                  className="w-full accent-[#1c1917] cursor-pointer"
                />
              </div>

              {/* Slider 2: Food Cost */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-[#57534e]">Modal Bahan Mentah (HPP):</span>
                  <span className="font-mono font-bold text-[#1c1917]">{formatIDR(foodCost)}</span>
                </div>
                <input
                  type="range"
                  min={2000}
                  max={40000}
                  step={500}
                  value={foodCost}
                  onChange={(e) => setFoodCost(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <span className="text-[11px] text-[#78716c] block">
                  Food Cost Ratio: <strong className="text-emerald-700">{foodCostPct.toFixed(1)}%</strong> (Batas aman: 28% – 35%)
                </span>
              </div>

              {/* Slider 3: Kemasan */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-[#57534e]">Biaya Cup / Kemasan Takeaway:</span>
                  <span className="font-mono font-bold text-[#1c1917]">{formatIDR(packagingCost)}</span>
                </div>
                <input
                  type="range"
                  min={500}
                  max={8000}
                  step={200}
                  value={packagingCost}
                  onChange={(e) => setPackagingCost(Number(e.target.value))}
                  className="w-full accent-[#78716c] cursor-pointer"
                />
              </div>
            </div>

            {/* Results: Dine-In vs Ojol Comparison */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Card 1: Dine-In */}
              <div className="bg-white p-6 rounded-2xl border border-[#e7e2da] shadow-xs space-y-4 flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#78716c]">Makan di Tempat</span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Dine-In
                    </span>
                  </div>

                  <div className="text-2xl sm:text-3xl font-extrabold text-[#1c1917] tabular-nums">
                    +{formatIDR(dineInProfit)}
                    <span className="text-xs font-normal text-[#78716c] block mt-0.5">Laba bersih per porsi</span>
                  </div>

                  <div className="pt-3 border-t border-[#f5f2eb] space-y-1.5 text-xs text-[#57534e]">
                    <div className="flex justify-between">
                      <span>Harga Menu:</span>
                      <strong className="font-mono text-[#1c1917]">{formatIDR(sellingPrice)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Modal Bahan:</span>
                      <strong className="font-mono text-rose-700">-{formatIDR(foodCost)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Gross Margin:</span>
                      <strong className="text-emerald-700 font-mono">{dineInMarginPct.toFixed(1)}%</strong>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-900 text-xs font-medium">
                  ✓ Margin sehat untuk menopang sewa outlet dan operasional.
                </div>
              </div>

              {/* Card 2: Online Ojol Markup */}
              <div className="bg-[#1c1917] text-white p-6 rounded-2xl shadow-md space-y-4 flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">Aplikasi Ojol</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/10 text-slate-200">
                      Komisi 20% + 1k
                    </span>
                  </div>

                  <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 tabular-nums">
                    +{formatIDR(suggestedProfit)}
                    <span className="text-xs font-normal text-slate-300 block mt-0.5">
                      Rekomendasi jual {formatIDR(suggestedOnlinePrice)}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-white/10 space-y-1.5 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span>Jika Dijual Normal ({formatIDR(sellingPrice)}):</span>
                      <strong className="text-rose-400 font-mono">Sisa Cuma +{formatIDR(onlineProfit)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Potongan Platform:</span>
                      <strong className="text-rose-400 font-mono">-{formatIDR(commissionDeduction)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Rekomendasi MarginOS:</span>
                      <strong className="text-emerald-400 font-mono">Markup {formatIDR(suggestedOnlinePrice)}</strong>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white/10 text-slate-200 text-xs font-medium">
                  Proteksi otomatis menjaga laba bersih Anda tidak tergerus biaya komisi.
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. CORE OPERATIONAL FEATURES (4 Essential Pillars)
          ───────────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 px-6 sm:px-12 lg:px-20 max-w-7xl mx-auto space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1c1917] tracking-tight">
            Dirancang untuk Operasional Dapur Nyata
          </h2>
          <p className="text-xs sm:text-sm text-[#78716c]">
            Hilangkan tebak-tebakan biaya dan pastikan standar rasa serta gramasi seragam di setiap cabang.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Feature 1 */}
          <div className="bg-white p-5 rounded-2xl border border-[#e7e2da] shadow-xs space-y-3">
            <div className="w-9 h-9 rounded-lg bg-[#faf8f5] border border-[#e7e2da] flex items-center justify-center text-[#1c1917]">
              <Scale className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-[#1c1917] text-sm">Presisi Yield Susut</h3>
            <p className="text-xs text-[#57534e] leading-relaxed">
              Kalkulasi otomatis susut daging, sayuran, dan biji kopi saat trimming, roasting, maupun proses pemasakan.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white p-5 rounded-2xl border border-[#e7e2da] shadow-xs space-y-3">
            <div className="w-9 h-9 rounded-lg bg-[#faf8f5] border border-[#e7e2da] flex items-center justify-center text-[#1c1917]">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-[#1c1917] text-sm">Proteksi Komisi Ojol</h3>
            <p className="text-xs text-[#57534e] leading-relaxed">
              Formula mark-up harga jual otomatis untuk GoFood, GrabFood, dan ShopeeFood demi mempertahankan target margin.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white p-5 rounded-2xl border border-[#e7e2da] shadow-xs space-y-3">
            <div className="w-9 h-9 rounded-lg bg-[#faf8f5] border border-[#e7e2da] flex items-center justify-center text-[#1c1917]">
              <ChefHat className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-[#1c1917] text-sm">Cetak SOP Dapur Bersih</h3>
            <p className="text-xs text-[#57534e] leading-relaxed">
              Cetak resep dan takaran memasak untuk koki/barista tanpa membocorkan rahasia harga beli supplier Anda.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white p-5 rounded-2xl border border-[#e7e2da] shadow-xs space-y-3">
            <div className="w-9 h-9 rounded-lg bg-[#faf8f5] border border-[#e7e2da] flex items-center justify-center text-[#1c1917]">
              <Store className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-[#1c1917] text-sm">Multi-Outlet &amp; Cabang</h3>
            <p className="text-xs text-[#57534e] leading-relaxed">
              Kelola menu seragam di semua cabang dengan pembukuan laba rugi (P&amp;L) dan akses staf yang terisolasi aman.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. PRICING PLANS
          ───────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 px-6 sm:px-12 lg:px-20 bg-white border-t border-[#e7e2da]">
        <div className="max-w-6xl mx-auto space-y-10">
          
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1c1917] tracking-tight">
              Pilihan Paket Langganan
            </h2>
            <p className="text-xs sm:text-sm text-[#78716c]">
              Mulai gratis 14 hari tanpa kartu kredit. Pembayaran lokal via QRIS, Virtual Account, &amp; e-Wallet.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            
            {/* Free Trial */}
            <div className="bg-[#faf8f5] p-6 sm:p-7 rounded-2xl border border-[#e7e2da] flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#78716c]">Uji Coba</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#1c1917]">
                  Rp 0 <span className="text-xs font-normal text-[#78716c]">/ 14 Hari</span>
                </div>
                <p className="text-xs text-[#57534e]">
                  Cocok untuk merapikan dan menghitung HPP menu pertama usaha Anda.
                </p>
                <ul className="space-y-2 text-xs text-[#57534e] pt-3 border-t border-[#e7e2da]">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-700" /> 1 Cabang Outlet</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-700" /> Maksimal 3 Pengguna</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-700" /> Kalkulator HPP &amp; Simulator Ojol</li>
                </ul>
              </div>
              <Link
                href="/register"
                className="w-full text-center py-2.5 rounded-lg border border-[#d6d0c4] hover:bg-white text-[#1c1917] font-semibold text-xs transition-colors block"
              >
                Coba Gratis Sekarang
              </Link>
            </div>

            {/* Starter F&B */}
            <div className="bg-[#1c1917] text-white p-6 sm:p-7 rounded-2xl shadow-lg flex flex-col justify-between space-y-6 relative border border-black/[0.2]">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">Starter F&amp;B</span>
                  <span className="text-[10px] bg-amber-400 text-[#1c1917] font-bold px-2 py-0.5 rounded">
                    Paling Banyak Dipilih
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white">
                  Rp 149.000 <span className="text-xs font-normal text-slate-400">/ Bulan</span>
                </div>
                <p className="text-xs text-slate-300">
                  Untuk kedai kopi, restoran mandiri, dan cloud kitchen yang ingin laba terkontrol rapi.
                </p>
                <ul className="space-y-2 text-xs text-slate-300 pt-3 border-t border-white/10">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Hingga 2 Cabang Outlet</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Hingga 7 Pengguna Tim</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Cetak SOP Dapur &amp; Ekspor CSV</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Audit Stok Opname COGS</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Laporan Laba Rugi (P&amp;L)</li>
                </ul>
              </div>
              <Link
                href="/register"
                className="w-full text-center py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-[#1c1917] font-bold text-xs transition-colors block"
              >
                Mulai Berlangganan Starter
              </Link>
            </div>

            {/* Pro Multi-Outlet */}
            <div className="bg-[#faf8f5] p-6 sm:p-7 rounded-2xl border border-[#e7e2da] flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#78716c]">Pro &amp; Cabang</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#1c1917]">
                  Rp 299.000 <span className="text-xs font-normal text-[#78716c]">/ Bulan</span>
                </div>
                <p className="text-xs text-[#57534e]">
                  Solusi manajemen menu terpusat untuk jaringan kuliner dengan banyak cabang.
                </p>
                <ul className="space-y-2 text-xs text-[#57534e] pt-3 border-t border-[#e7e2da]">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-700" /> Unlimited Cabang Outlet</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-700" /> Unlimited Pengguna (Staf &amp; Manajer)</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-700" /> Modul CRM Katering &amp; B2B</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-700" /> Prioritas Support WhatsApp</li>
                </ul>
              </div>
              <Link
                href="/register"
                className="w-full text-center py-2.5 rounded-lg border border-[#d6d0c4] hover:bg-white text-[#1c1917] font-semibold text-xs transition-colors block"
              >
                Pilih Paket Pro
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. FAQ ACCORDION
          ───────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 px-6 sm:px-12 lg:px-20 max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1c1917] tracking-tight">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="text-xs sm:text-sm text-[#78716c]">
            Jawaban lengkap seputar cara kerja MarginOS dan pengelolaan resep.
          </p>
        </div>

        <div className="space-y-2.5">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-xl border border-[#e7e2da] overflow-hidden shadow-xs"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-4.5 text-left flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-[#1c1917] cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <div className="w-5 h-5 rounded-md bg-[#faf8f5] border border-[#e7e2da] flex items-center justify-center shrink-0">
                    {isOpen ? <Minus className="w-3 h-3 text-[#57534e]" /> : <Plus className="w-3 h-3 text-[#57534e]" />}
                  </div>
                </button>
                {isOpen && (
                  <div className="px-4.5 pb-4 text-xs sm:text-sm text-[#57534e] leading-relaxed border-t border-[#f5f2eb] pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          8. FOOTER
          ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#e7e2da] bg-white py-10 px-6 sm:px-12 lg:px-20 text-xs text-[#78716c]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#1c1917] text-amber-50 flex items-center justify-center font-mono font-bold text-[10px]">
              M
            </div>
            <span className="font-bold text-[#1c1917] text-sm">MarginOS</span>
            <span>― The Culinary Operating System.</span>
          </div>

          <div className="flex items-center gap-6 text-[#57534e] font-medium">
            <Link href="/login" className="hover:text-[#1c1917]">Masuk Akun</Link>
            <Link href="/register" className="hover:text-[#1c1917]">Daftar Coba Gratis</Link>
            <a href="#hero" className="hover:text-[#1c1917]">Kembali ke Atas ↑</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
