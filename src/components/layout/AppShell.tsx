"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOutlet } from "@/context/OutletContext";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  LayoutDashboard,
  Package,
  Layers,
  UtensilsCrossed,
  ClipboardCheck,
  TrendingUp,
  Store,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Menu as MenuIcon,
  X,
  Check,
  LogOut,
  User as UserIcon,
  Search,
  Settings,
  Calculator,
  Smartphone,
  Printer,
  Users,
  Crown,
  ShoppingBag,
  PieChart,
} from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { outlets, currentOutlet, setCurrentOutlet } = useOutlet();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [outletDropdownOpen, setOutletDropdownOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [session, setSession] = useState<any>(null);

  // Load persistent sidebar state
  useEffect(() => {
    try {
      const saved = localStorage.getItem("marginos_sidebar_collapsed");
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      }
    } catch {}

    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.authenticated) {
          setSession(data);
        }
      })
      .catch(() => {});
  }, []);

  // Keyboard shortcut: Ctrl + B / Cmd + B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("marginos_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  const toggleGroup = (groupTitle: string) => {
    if (isCollapsed) return; // groups stay open when collapsed
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupTitle]: !prev[groupTitle],
    }));
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  // If on landing or auth pages, render standalone view without shell frame
  if (pathname === "/" || pathname === "/landing" || pathname === "/login" || pathname === "/register") {
    return <>{children}</>;
  }

  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN" || pathname.startsWith("/super-admin");

  // Navigation Groupings with Badges and Icons
  const navigationGroups = isSuperAdmin
    ? [
        {
          title: "Platform Owner",
          items: [
            { name: "Platform Owner & MRR", href: "/super-admin", icon: Crown, badge: "SaaS", badgeColor: "amber" },
            { name: "Kelola Pengguna Platform", href: "/admin", icon: Users, badge: "Users", badgeColor: "grey" },
            { name: "Cabang Terdaftar", href: "/outlets", icon: Store, badge: "Multi", badgeColor: "grey" },
            { name: "Simulasi Finansial Resto", href: "/financials", icon: PieChart, badge: "Sim", badgeColor: "teal" },
          ],
        },
      ]
    : [
        {
          title: "Kalkulasi & Resep",
          items: [
            { name: "Dashboard Analitik", href: "/dashboard", icon: LayoutDashboard, badge: "Live", badgeColor: "teal" },
            { name: "Kalkulator Cepat HPP", href: "/quick-calc", icon: Calculator, badge: "Calc", badgeColor: "grey" },
            { name: "Katalog & Resep Menu", href: "/menus", icon: UtensilsCrossed, badge: "Menu", badgeColor: "grey" },
            { name: "Simulator Harga Ojol", href: "/pricing-simulator", icon: Smartphone, badge: "Ojol", badgeColor: "amber" },
          ],
        },
        {
          title: "Bahan Baku & Dapur",
          items: [
            { name: "Bahan Mentah & Yield", href: "/ingredients", icon: Package, badge: "Yield", badgeColor: "grey" },
            { name: "Belanja Bahan (Restock)", href: "/purchases", icon: ShoppingBag, badge: "PO", badgeColor: "blue" },
            { name: "Olahan Sub-Resep", href: "/sub-recipes", icon: Layers, badge: "Batch", badgeColor: "grey" },
            { name: "Stok Opname COGS", href: "/cogs-inventory", icon: ClipboardCheck, badge: "COGS", badgeColor: "teal" },
          ],
        },
        {
          title: "Analisis & Bisnis",
          items: [
            { name: "Matriks Menu & BEP", href: "/menu-engineering", icon: TrendingUp, badge: "BEP", badgeColor: "amber" },
            { name: "Laporan Laba Rugi", href: "/financials", icon: PieChart, badge: "P&L", badgeColor: "grey" },
            { name: "Cetak SOP Dapur", href: "/sop-export", icon: Printer, badge: "PDF", badgeColor: "grey" },
            { name: "Cabang & Outlet", href: "/outlets", icon: Store, badge: "Store", badgeColor: "grey" },
            { name: "Kelola Akun & CRM", href: "/admin", icon: Settings, badge: "CRM", badgeColor: "grey" },
          ],
        },
      ];

  const isLinkActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const getPageTitle = () => {
    if (pathname === "/dashboard" || pathname === "/") return "Ringkasan Operasional & Margin";
    if (pathname.startsWith("/quick-calc")) return "Kalkulator Cepat HPP";
    if (pathname.startsWith("/menus")) return "Katalog Menu & Resep";
    if (pathname.startsWith("/pricing-simulator")) return "Simulator Harga Jual Online (Ojol)";
    if (pathname.startsWith("/ingredients")) return "Database Bahan Baku & Yield Susut";
    if (pathname.startsWith("/purchases")) return "Pencatatan Pembelian Bahan Baku";
    if (pathname.startsWith("/sub-recipes")) return "Sub-Resep Bahan Olahan Dasar";
    if (pathname.startsWith("/cogs-inventory")) return "Stok Opname & Audit Selisih COGS";
    if (pathname.startsWith("/menu-engineering")) return "Matriks Menu Engineering & BEP";
    if (pathname.startsWith("/financials")) return "Laporan Laba Rugi (P&L)";
    if (pathname.startsWith("/sop-export")) return "SOP Resep Dapur & Ekspor HPP";
    if (pathname.startsWith("/outlets")) return "Manajemen Cabang & Outlet";
    if (pathname.startsWith("/admin")) return "Administrator Akun & Pengaturan";
    if (pathname.startsWith("/super-admin")) return "Super Admin Platform Owner";
    return "MarginOS Analytics";
  };

  const getBadgeStyle = (badgeColor: string, active: boolean) => {
    if (active) {
      return "bg-[#00b5ad] text-white border border-[#00b5ad]";
    }
    switch (badgeColor) {
      case "teal":
        return "bg-teal-50 dark:bg-[#00b5ad]/15 text-teal-700 dark:text-[#00b5ad] border border-teal-200 dark:border-[#00b5ad]/30";
      case "amber":
        return "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30";
      case "blue":
        return "bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-500/30";
      default:
        return "bg-zinc-100 dark:bg-[#282a2d] text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/[0.06]";
    }
  };

  return (
    <div className="min-h-screen bg-[#141415] text-[#ededed] font-sans flex antialiased">
      
      {/* ─────────────────────────────────────────────────────────────
          1. INTERACTIVE DESKTOP SIDEBAR (Figma-Grade Collapsible UI)
          ───────────────────────────────────────────────────────────── */}
      <aside
        className={`hidden lg:flex shrink-0 flex-col justify-between bg-[#191a1d] border-r border-white/[0.08] z-30 shadow-2xl transition-all duration-300 ease-in-out relative ${
          isCollapsed ? "w-[72px]" : "w-64"
        }`}
      >
        {/* Top Section */}
        <div className="flex flex-col">
          {/* Brand Header with Collapse Toggle */}
          <div className="h-14 px-3.5 flex items-center justify-between border-b border-white/[0.08] bg-[#141517]">
            <Link href="/dashboard" className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00b5ad] to-teal-400 text-white flex items-center justify-center font-black text-sm shadow-md shadow-teal-500/20 shrink-0">
                M
              </div>
              {!isCollapsed && (
                <div className="truncate animate-fadeIn">
                  <span className="font-bold text-sm tracking-tight text-white block leading-none">
                    Margin<span className="text-zinc-400 font-normal">OS</span>
                  </span>
                  <span className="text-[9px] font-mono tracking-widest text-[#00b5ad] uppercase font-semibold">
                    Interactive UI
                  </span>
                </div>
              )}
            </Link>

            {/* Collapse / Expand Toggle Button */}
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
              title={isCollapsed ? "Perluas Sidebar (Ctrl + B)" : "Lipat Sidebar (Ctrl + B)"}
            >
              {isCollapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Current Outlet Selector */}
          <div className="p-2.5 border-b border-white/[0.06] bg-[#16171a] space-y-2">
            <div className="relative">
              {isCollapsed ? (
                // Collapsed Outlet Button with Tooltip
                <div
                  onMouseEnter={() => setHoveredItem("outlet-tooltip")}
                  onMouseLeave={() => setHoveredItem(null)}
                  className="relative"
                >
                  <button
                    type="button"
                    onClick={() => setOutletDropdownOpen(!outletDropdownOpen)}
                    className="w-full h-10 rounded-xl bg-white dark:bg-[#202226] hover:bg-zinc-100 dark:hover:bg-[#282a30] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Store className="w-4 h-4 text-[#00b5ad]" />
                  </button>

                  {/* Tooltip on Hover with Arrow */}
                  {hoveredItem === "outlet-tooltip" && !outletDropdownOpen && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 rounded-lg bg-white dark:bg-[#202226] border border-zinc-200 dark:border-white/[0.12] text-xs font-semibold text-zinc-900 dark:text-white whitespace-nowrap shadow-xl z-50 pointer-events-none">
                      <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-white dark:bg-[#202226] border-l border-b border-zinc-200 dark:border-white/[0.12] rotate-45" />
                      <div>{currentOutlet?.name || "Pilih Cabang"}</div>
                      <div className="text-[10px] text-[#00b5ad] font-normal">Klik untuk ganti cabang</div>
                    </div>
                  )}
                </div>
              ) : (
                // Expanded Outlet Dropdown
                <button
                  type="button"
                  onClick={() => setOutletDropdownOpen(!outletDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white dark:bg-[#202226] hover:bg-zinc-50 dark:hover:bg-[#282a30] border border-zinc-200 dark:border-white/[0.08] text-xs transition-colors cursor-pointer shadow-2xs group"
                >
                  <div className="flex items-center gap-2 truncate text-left">
                    <Store className="w-4 h-4 text-[#00b5ad] shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-zinc-800 dark:text-zinc-100 truncate">
                      {currentOutlet?.name || "Pilih Outlet"}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0 ml-1.5 group-hover:text-zinc-600 dark:group-hover:text-zinc-200" />
                </button>
              )}

              {/* Outlet Dropdown Menu */}
              {outletDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOutletDropdownOpen(false)} />
                  <div className="absolute left-0 right-0 mt-1.5 rounded-xl border border-zinc-200 dark:border-white/[0.12] bg-white dark:bg-[#1a1b1f] p-1.5 shadow-2xl z-50 min-w-[200px]">
                    <div className="px-2.5 py-1 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-b border-zinc-100 dark:border-white/[0.08]">
                      Pilih Cabang Aktif
                    </div>
                    <div className="space-y-0.5 mt-1 max-h-48 overflow-y-auto">
                      {outlets.map((outlet) => {
                        const isSelected = outlet.id === currentOutlet?.id;
                        return (
                          <button
                            key={outlet.id}
                            type="button"
                            onClick={() => {
                              setCurrentOutlet(outlet);
                              setOutletDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? "bg-teal-50 dark:bg-[#252830] text-teal-900 dark:text-white font-semibold border-l-2 border-[#00b5ad]"
                                : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.05] hover:text-zinc-900 dark:hover:text-white"
                            }`}
                          >
                            <span className="truncate">{outlet.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#00b5ad] shrink-0 ml-1" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Quick Interactive Search Bar in Expanded Mode */}
            {!isCollapsed && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari navigasi... (Ctrl+B)"
                  className="w-full bg-white dark:bg-[#1e2024] hover:bg-zinc-50 dark:hover:bg-[#23252a] focus:bg-white dark:focus:bg-[#23252a] border border-zinc-200 dark:border-white/[0.06] focus:border-[#00b5ad]/60 rounded-lg pl-8 pr-7 py-1.5 text-[11px] text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none transition-all shadow-2xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="p-2 space-y-3.5 overflow-y-auto max-h-[calc(100vh-230px)]">
            {navigationGroups.map((group, gIdx) => {
              const filteredItems = searchQuery.trim()
                ? group.items.filter((item) =>
                    item.name.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                : group.items;

              if (searchQuery.trim() && filteredItems.length === 0) return null;

              const isGroupCollapsed = collapsedGroups[group.title] && !searchQuery.trim();
              return (
                <div key={gIdx} className="space-y-1">
                  {/* Category Header (Accordion in expanded mode) */}
                  {!isCollapsed ? (
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.title)}
                      className="w-full flex items-center justify-between px-2.5 py-1 text-[10px] font-bold tracking-wider text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 uppercase cursor-pointer select-none transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        {group.title}
                        <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-normal">({filteredItems.length})</span>
                      </span>
                      <ChevronRight
                        className={`w-3 h-3 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 ${
                          isGroupCollapsed ? "" : "rotate-90"
                        }`}
                      />
                    </button>
                  ) : (
                    <div className="w-6 h-[1px] bg-zinc-200 dark:bg-white/[0.08] mx-auto my-2" />
                  )}

                  {/* Items List */}
                  {(!isGroupCollapsed || isCollapsed) && (
                    <div className="space-y-1">
                      {filteredItems.map((item) => {
                        const Icon = item.icon;
                        const active = isLinkActive(item.href);
                        return (
                          <div
                            key={item.href}
                            className="relative group"
                            onMouseEnter={() => setHoveredItem(item.href)}
                            onMouseLeave={() => setHoveredItem(null)}
                          >
                            <Link
                              href={item.href}
                              className={`flex items-center rounded-xl transition-all duration-200 cursor-pointer ${
                                isCollapsed
                                  ? "w-11 h-11 mx-auto justify-center"
                                  : "h-9 px-3 justify-between"
                              } ${
                                active
                                  ? "bg-teal-50 dark:bg-[#23262d] text-teal-900 dark:text-white font-semibold border-l-4 border-[#00b5ad] shadow-2xs"
                                  : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-white/[0.05] border-l-4 border-transparent hover:translate-x-0.5"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <Icon
                                  className={`w-4 h-4 shrink-0 transition-colors ${
                                    active ? "text-[#00b5ad]" : "text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200"
                                  }`}
                                />
                                {!isCollapsed && <span className="truncate text-xs">{item.name}</span>}
                              </div>

                              {/* Badge (Expanded Mode) */}
                              {!isCollapsed && item.badge && (
                                <span
                                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold shrink-0 ml-1.5 ${getBadgeStyle(
                                    item.badgeColor,
                                    active
                                  )}`}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </Link>

                            {/* Floating Tooltip in Collapsed Mode with Arrow */}
                            {isCollapsed && hoveredItem === item.href && (
                              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 rounded-lg bg-white dark:bg-[#202226] border border-zinc-200 dark:border-white/[0.12] text-xs font-semibold text-zinc-900 dark:text-white whitespace-nowrap shadow-xl z-50 pointer-events-none flex items-center gap-2 animate-fadeIn">
                                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-white dark:bg-[#202226] border-l border-b border-zinc-200 dark:border-white/[0.12] rotate-45" />
                                <span>{item.name}</span>
                                {item.badge && (
                                  <span
                                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold ${getBadgeStyle(
                                      item.badgeColor,
                                      active
                                    )}`}
                                  >
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Profile Section */}
        <div className="p-2.5 border-t border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-[#141517] space-y-2">
          {/* Theme Toggle in Sidebar */}
          {!isCollapsed ? (
            <div className="pb-0.5">
              <ThemeToggle variant="sidebar" />
            </div>
          ) : (
            <div className="flex justify-center pb-0.5">
              <ThemeToggle variant="icon" />
            </div>
          )}

          {session ? (
            <div
              className={`flex items-center rounded-xl bg-white dark:bg-[#202226] border border-zinc-200 dark:border-white/[0.08] transition-all shadow-xs ${
                isCollapsed ? "p-1.5 justify-center" : "p-2 justify-between"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <div className="relative shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-[#00b5ad] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    {session.user.name?.slice(0, 2).toUpperCase() || "U"}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#202226]" />
                </div>
                {!isCollapsed && (
                  <div className="truncate">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">{session.user.name}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono truncate">{session.user.role}</p>
                  </div>
                )}
              </div>

              {!isCollapsed && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/[0.08] text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer"
                  title="Keluar"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className={`flex items-center rounded-xl bg-white dark:bg-[#202226] border border-zinc-200 dark:border-white/[0.08] text-xs font-medium text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-[#282a30] transition-colors shadow-xs ${
                isCollapsed ? "h-10 w-full justify-center" : "py-2 px-3 justify-center gap-2"
              }`}
              title="Masuk Akun"
            >
              <UserIcon className="w-4 h-4 text-[#00b5ad]" />
              {!isCollapsed && <span>Masuk Akun</span>}
            </Link>
          )}
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN WORKSPACE AREA (Header + Content)
          ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f8f9fb] dark:bg-[#141415] transition-colors duration-200">
        
        {/* Top Header Bar */}
        <header className="h-14 px-5 sm:px-8 border-b border-zinc-200 dark:border-white/[0.08] flex items-center justify-between bg-white/85 dark:bg-[#0f0f10]/80 backdrop-blur-md sticky top-0 z-20 transition-colors">
          
          {/* Left: Mobile Toggle & Page Title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
            </button>

            <div>
              <h1 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-[#ededed] tracking-tight">
                {getPageTitle()}
              </h1>
            </div>
          </div>

          {/* Right: Quick Shortcuts + Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* LIGHT / DARK THEME TOGGLE BUTTON */}
            <ThemeToggle variant="icon" />

            <Link
              href="/menus"
              className="h-8 px-2.5 rounded-lg bg-white dark:bg-[#1b1c1d] hover:bg-zinc-100 dark:hover:bg-[#242526] border border-zinc-200 dark:border-[#3b3c3e] flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors shadow-xs"
              title="Cari Menu atau Bahan"
            >
              <Search className="w-3.5 h-3.5 text-[#00b5ad]" />
              <span className="hidden sm:inline">Cari Resep...</span>
            </Link>

            <Link
              href="/"
              className="h-8 px-3 rounded-lg bg-white dark:bg-[#1b1c1d] hover:bg-zinc-100 dark:hover:bg-[#242526] border border-zinc-200 dark:border-[#3b3c3e] flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white transition-colors shadow-xs"
              title="Kunjungi Landing Page"
            >
              <span>Landing Page</span>
            </Link>

            {isSuperAdmin && (
              <Link
                href="/super-admin"
                className="h-8 px-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 dark:text-amber-400 hover:bg-amber-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Crown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Super Admin</span>
              </Link>
            )}
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative bg-white dark:bg-[#1b1c1d] w-4/5 max-w-xs h-full p-4 flex flex-col shadow-2xl border-r border-zinc-200 dark:border-[#2d2e2f] z-50">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-[#2d2e2f]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#00b5ad] text-white flex items-center justify-center font-bold text-xs shadow-md">
                    M
                  </div>
                  <span className="font-bold text-sm text-zinc-900 dark:text-white">MarginOS</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 mt-3 flex-1 overflow-y-auto">
                {navigationGroups.map((group, gIdx) => (
                  <div key={gIdx} className="space-y-1">
                    <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider px-2">
                      {group.title}
                    </div>
                    <div className="space-y-0.5 pt-0.5">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const active = isLinkActive(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                              active
                                ? "bg-teal-50 dark:bg-[#25272a] text-teal-900 dark:text-white font-semibold border-l-4 border-[#00b5ad]"
                                : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.05] hover:text-zinc-900 dark:hover:text-white"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <Icon className={`w-4 h-4 ${active ? "text-[#00b5ad]" : "text-zinc-500 dark:text-zinc-400"}`} />
                              <span>{item.name}</span>
                            </div>
                            {item.badge && (
                              <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold ${getBadgeStyle(item.badgeColor, active)}`}>
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-zinc-200 dark:border-[#2d2e2f] space-y-2">
                <ThemeToggle variant="sidebar" />
                <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 pt-1">
                  <span>MarginOS v2.4</span>
                  <button onClick={handleLogout} className="text-rose-500 dark:text-rose-400 hover:underline cursor-pointer">
                    Keluar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-5 sm:p-7 lg:p-8 max-w-[1440px] w-full mx-auto overflow-y-auto">
          {children}
        </main>

      </div>
    </div>
  );
}
