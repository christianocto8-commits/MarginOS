"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  ChevronDown,
  Check,
  AlertCircle,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

// Curated Showcase Slides for the Left Card
const showcaseSlides = [
  {
    id: 1,
    tag: "Selected Works",
    title: "Culinary Engineering & Precision Costing",
    subtitle: "Kalkulasi HPP akurat hingga ke gramatur terkecil dan susut yield.",
    image: "/hero-culinary.jpg",
    author: {
      name: "Chef Julian S.",
      role: "Executive Chef & Resto Founder",
      avatar: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=120&auto=format&fit=crop&q=80",
    },
  },
  {
    id: 2,
    tag: "Multi-Outlet Ops",
    title: "Realtime COGS & Restock Automation",
    subtitle: "Pantau selisih stok opname dan profit harian di semua cabang.",
    image: "/hero-nature.jpg",
    author: {
      name: "Sarah W.",
      role: "Co-Founder, Artisan Bistro & Coffee",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
    },
  },
  {
    id: 3,
    tag: "Ojol Simulator",
    title: "Smart Margin & Commission Optimizer",
    subtitle: "Simulasi diskon kampanye tanpa boncos tergerus komisi platform.",
    image: "/hero-culinary.jpg",
    author: {
      name: "Aris Pratama",
      role: "Group Operations Director",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    },
  },
];

export default function LoginPage() {
  const router = useRouter();

  // Form states
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Slide state
  const [currentSlide, setCurrentSlide] = useState(0);

  // Language switcher state
  const [lang, setLang] = useState<"EN" | "ID">("ID");
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const slide = showcaseSlides[currentSlide];

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % showcaseSlides.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + showcaseSlides.length) % showcaseSlides.length);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (lang === "EN" ? "Failed to sign in" : "Gagal masuk ke akun"));
      }

      if (data.user?.role === "SUPER_ADMIN") {
        router.push("/super-admin");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || (lang === "EN" ? "Connection error occurred" : "Terjadi kesalahan koneksi"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0e12] flex items-center justify-center p-3 sm:p-6 lg:p-10 font-sans selection:bg-red-500 selection:text-white relative overflow-hidden">
      
      {/* Ambient background glow & atmospheric backdrop */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none bg-cover bg-center filter blur-3xl scale-110"
        style={{ backgroundImage: `url(${slide.image})` }}
      />
      <div className="absolute inset-0 bg-radial from-transparent via-[#0d0e12]/80 to-[#0d0e12] pointer-events-none" />

      {/* Main Glass/Card Wrapper */}
      <div className="relative w-full max-w-[1040px] bg-[#14151a]/90 backdrop-blur-2xl border border-white/[0.08] rounded-[36px] sm:rounded-[44px] shadow-2xl p-2.5 sm:p-3.5 flex flex-col lg:flex-row gap-3 sm:gap-4 z-10">

        {/* ─────────────────────────────────────────────────────────────
            LEFT PANEL: Artistic Showcase Card (Selected Works)
            ───────────────────────────────────────────────────────────── */}
        <div className="relative lg:w-[48%] min-h-[460px] lg:min-h-[600px] rounded-[28px] sm:rounded-[36px] overflow-hidden flex flex-col justify-between p-6 sm:p-8 bg-[#111216] border border-white/[0.08] shadow-inner group">
          
          {/* Background Image with Cinematic Dark Gradient */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-700 transform group-hover:scale-105"
            style={{ backgroundImage: `url(${slide.image})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/60" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/60" />

          {/* Top Bar of Left Card */}
          <div className="relative z-10 flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold tracking-wide text-white/90 drop-shadow-md">
              {slide.tag}
            </span>

            <div className="flex items-center gap-2.5">
              <Link
                href="/register"
                className="text-xs font-medium text-white/80 hover:text-white transition-colors drop-shadow-sm px-1.5"
              >
                Sign Up
              </Link>
              <Link
                href="/register"
                className="px-3.5 py-1 rounded-full border border-white/60 bg-white/10 hover:bg-white/20 backdrop-blur-md text-xs font-semibold text-white transition-all shadow-sm active:scale-95"
              >
                Join Us
              </Link>
            </div>
          </div>

          {/* Center Space: Visual Showcase Highlights */}
          <div className="relative z-10 my-auto py-6">
            <div className="inline-block px-2.5 py-1 rounded-lg bg-red-500/20 border border-red-500/40 text-[11px] font-mono font-semibold text-red-300 uppercase tracking-wider mb-3">
              MarginOS Intelligence
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white leading-tight drop-shadow-lg tracking-tight">
              {slide.title}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-zinc-300 font-normal leading-relaxed max-w-sm drop-shadow-md">
              {slide.subtitle}
            </p>
          </div>

          {/* Bottom Bar: Creator Profile + Navigation Arrows */}
          <div className="relative z-10 flex items-center justify-between pt-4 border-t border-white/[0.12]">
            
            {/* User Profile Info */}
            <div className="flex items-center gap-3">
              <img
                src={slide.author.avatar}
                alt={slide.author.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-white/40 shadow-md ring-2 ring-black/40"
              />
              <div className="text-left">
                <p className="text-xs sm:text-sm font-bold text-white tracking-tight leading-none">
                  {slide.author.name}
                </p>
                <p className="text-[11px] text-zinc-300/80 mt-1 font-medium leading-none">
                  {slide.author.role}
                </p>
              </div>
            </div>

            {/* Carousel Next / Prev Pill Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevSlide}
                className="w-8 h-8 rounded-full border border-white/25 bg-black/40 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white/90 hover:text-white transition-all cursor-pointer active:scale-90"
                aria-label="Previous Slide"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNextSlide}
                className="w-8 h-8 rounded-full border border-white/25 bg-black/40 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white/90 hover:text-white transition-all cursor-pointer active:scale-90"
                aria-label="Next Slide"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            RIGHT PANEL: Crisp White Login Form (Figma Exact Style)
            ───────────────────────────────────────────────────────────── */}
        <div className="lg:w-[52%] bg-white text-zinc-900 rounded-[28px] sm:rounded-[36px] p-6 sm:p-9 lg:p-12 flex flex-col justify-between shadow-sm">
          
          {/* Top Row: Brand Logo & Language Switcher */}
          <div className="flex items-center justify-between pb-4">
            
            {/* Brand Logo: UISOCIAL / MARGINOS */}
            <Link href="/landing" className="flex items-center gap-2 group">
              <span className="text-lg sm:text-xl font-black tracking-tight text-zinc-950 uppercase">
                Margin<span className="text-zinc-500 font-semibold">OS</span>
              </span>
            </Link>

            {/* Theme Toggle & Language Switcher */}
            <div className="flex items-center gap-2">
              <ThemeToggle variant="icon" />

              {/* Language Switcher Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
                >
                  <span>{lang === "EN" ? "🇬🇧 EN" : "🇮🇩 ID"}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                </button>

              {langDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setLangDropdownOpen(false)} />
                  <div className="absolute right-0 mt-1.5 w-28 bg-white border border-zinc-200 rounded-xl shadow-xl p-1 z-30">
                    <button
                      type="button"
                      onClick={() => {
                        setLang("EN");
                        setLangDropdownOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs font-medium rounded-lg hover:bg-zinc-100 flex items-center justify-between text-zinc-800"
                    >
                      <span>🇬🇧 English</span>
                      {lang === "EN" && <Check className="w-3 h-3 text-red-500" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLang("ID");
                        setLangDropdownOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs font-medium rounded-lg hover:bg-zinc-100 flex items-center justify-between text-zinc-800"
                    >
                      <span>🇮🇩 Indonesia</span>
                      {lang === "ID" && <Check className="w-3 h-3 text-red-500" />}
                    </button>
                  </div>
                </>
              )}
              </div>
            </div>
          </div>

          {/* Main Form Center */}
          <div className="my-auto py-4 sm:py-6 max-w-sm w-full mx-auto">
            
            {/* Universal Clean Greeting */}
            <div className="text-center mb-7">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 tracking-tight">
                {lang === "EN" ? "Welcome Back" : "Selamat Datang"}
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-zinc-500 font-medium">
                {lang === "EN"
                  ? "Sign in to manage your kitchen & profit margins"
                  : "Masuk untuk kelola HPP, resep & laba resto Anda"}
              </p>
            </div>

            {/* Error Notification Alert */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Email Input */}
              <div>
                <input
                  type="email"
                  required
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-800 text-sm text-zinc-900 placeholder:text-zinc-400 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800 transition-colors"
                />
              </div>

              {/* Password Input with Visibility Toggle */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-zinc-800 text-sm text-zinc-900 placeholder:text-zinc-400 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800 pr-10 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Forgot Password Link (Red coral color like reference) */}
              <div className="text-right">
                <Link
                  href="/register"
                  className="text-xs font-medium text-[#ef4444] hover:text-red-600 hover:underline transition-colors"
                >
                  {lang === "EN" ? "Forgot password ?" : "Lupa kata sandi ?"}
                </Link>
              </div>

              {/* Primary CTA Submit Button: Coral Red Pill */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-full bg-[#ef4444] hover:bg-[#dc2626] text-white font-bold text-sm shadow-lg shadow-red-500/25 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-70 mt-2"
              >
                {loading
                  ? (lang === "EN" ? "Signing in..." : "Memproses...")
                  : (lang === "EN" ? "Login" : "Masuk ke Dashboard")}
              </button>

              {/* Don't have an account ? Sign up */}
              <div className="text-center pt-2 text-xs text-zinc-600 font-medium">
                {lang === "EN" ? "Don't have an account? " : "Belum punya akun? "}
                <Link
                  href="/register"
                  className="text-[#ef4444] font-bold hover:underline ml-1"
                >
                  {lang === "EN" ? "Sign up" : "Daftar"}
                </Link>
              </div>

            </form>
          </div>

          {/* Bottom Social Icons Row */}
          <div className="flex items-center justify-center gap-4 pt-4 border-t border-zinc-100">
            {/* Facebook */}
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
              aria-label="Facebook"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95C18.05 21.45 22 17.19 22 12z" />
              </svg>
            </a>
            {/* Twitter / X */}
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
              aria-label="Twitter"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            {/* LinkedIn */}
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
              aria-label="LinkedIn"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.44 1.44 0 0 0 1.44-1.44c0-.8-.64-1.44-1.44-1.44a1.44 1.44 0 0 0-1.44 1.44c0 .8.64 1.44 1.44 1.44m1.39 10.24v-8.37H5.07v8.37h2.78z" />
              </svg>
            </a>
            {/* Instagram */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
              aria-label="Instagram"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
          </div>

        </div>

      </div>

    </div>
  );
}
