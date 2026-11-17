"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOutlet } from "@/context/OutletContext";
import { formatIDR, formatNumber } from "@/lib/costing-engine";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  Receipt,
  Store,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Printer,
  CreditCard,
  QrCode,
  Banknote,
  Utensils,
  ShoppingBag,
  Bike,
  Sparkles,
  X,
  Layers,
  ChevronRight,
} from "lucide-react";

interface CartItem {
  id: string;
  name: string;
  price: number;
  cogs: number;
  quantity: number;
  notes?: string;
  category: string;
}

const DEFAULT_MENU_ITEMS = [
  { id: "m1", name: "Es Kopi Susu Aren", category: "Coffee & Espresso", price: 20000, cogs: 5200 },
  { id: "m2", name: "Americano Classic", category: "Coffee & Espresso", price: 18000, cogs: 3500 },
  { id: "m3", name: "Caramel Macchiato", category: "Coffee & Espresso", price: 28000, cogs: 8200 },
  { id: "m4", name: "Matcha Latte Creamy", category: "Non-Coffee & Tea", price: 26000, cogs: 7400 },
  { id: "m5", name: "Earl Grey Artisan Tea", category: "Non-Coffee & Tea", price: 20000, cogs: 4100 },
  { id: "m6", name: "Ayam Geprek Sambal Korek", category: "Main Course", price: 28000, cogs: 9500 },
  { id: "m7", name: "Nasi Goreng Spesial Resto", category: "Main Course", price: 32000, cogs: 11200 },
  { id: "m8", name: "Butter Croissant French", category: "Pastry & Bakery", price: 25000, cogs: 8600 },
  { id: "m9", name: "Pain Au Chocolat", category: "Pastry & Bakery", price: 28000, cogs: 9200 },
  { id: "m10", name: "French Fries Crinkle", category: "Snacks", price: 18000, cogs: 5100 },
  { id: "m11", name: "Tahu Walik Krispi", category: "Snacks", price: 16000, cogs: 4400 },
];

export default function POSPage() {
  const router = useRouter();
  const { currentOutlet } = useOutlet();
  const [session, setSession] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Cart State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [orderType, setOrderType] = useState<"dine_in" | "takeaway" | "delivery">("dine_in");
  const [tableNumber, setTableNumber] = useState("01");
  const [customerName, setCustomerName] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);

  // Checkout & Payment Modals
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "qris" | "edc">("cash");
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState("");

  // Live clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch session & live menu data
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
      .catch(() => router.push("/login"));
  }, [router]);

  useEffect(() => {
    if (!currentOutlet) return;
    setLoading(true);

    fetch(`/api/menus?outletId=${currentOutlet.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.menus && data.menus.length > 0) {
          const formatted = data.menus.map((m: any) => ({
            id: m.id,
            name: m.name,
            category: m.category || "Beverage",
            price: m.dineIn?.sellingPrice || 20000,
            cogs: m.cogsPerPortion || 5000,
          }));
          setMenuItems(formatted);
        } else {
          setMenuItems(DEFAULT_MENU_ITEMS);
        }
      })
      .catch(() => setMenuItems(DEFAULT_MENU_ITEMS))
      .finally(() => setLoading(false));
  }, [currentOutlet]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    set.add("Semua");
    menuItems.forEach((m) => {
      if (m.category) set.add(m.category);
    });
    return Array.from(set);
  }, [menuItems]);

  // Filtered menu list
  const filteredMenus = useMemo(() => {
    return menuItems.filter((m) => {
      const matchCat = selectedCategory === "Semua" || m.category === selectedCategory;
      const matchQuery =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  // Cart operations
  const addToCart = (item: any) => {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.id === item.id);
      if (existing) {
        return prev.map((ci) =>
          ci.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          price: item.price,
          cogs: item.cogs,
          quantity: 1,
          category: item.category,
        },
      ];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const updateNotes = (id: string, notes: string) => {
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, notes } : item))
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Financial Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [cart]);

  const taxPb1 = Math.round(subtotal * 0.1); // PB1 10%
  const serviceCharge = orderType === "dine_in" ? Math.round(subtotal * 0.05) : 0; // 5% Service on Dine-In
  const grandTotal = subtotal + taxPb1 + serviceCharge;

  // Total HPP / COGS for analytics
  const totalCogs = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.cogs * item.quantity, 0);
  }, [cart]);
  const estimatedProfit = grandTotal - taxPb1 - serviceCharge - totalCogs;

  const handleOpenPayment = () => {
    if (cart.length === 0) return;
    setCashAmount(grandTotal);
    setPaymentModalOpen(true);
  };

  const handleProcessPayment = () => {
    const orderData = {
      orderId: `TRX-${Date.now().toString().slice(-6)}`,
      date: new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      time: currentTime,
      outletName: currentOutlet?.name || "Cabang Utama",
      cashier: session?.user?.name || "Kasir",
      orderType,
      tableNumber: orderType === "dine_in" ? tableNumber : "-",
      customerName: customerName || (orderType === "dine_in" ? `Meja ${tableNumber}` : "Pelanggan"),
      items: [...cart],
      subtotal,
      taxPb1,
      serviceCharge,
      grandTotal,
      paymentMethod,
      cashAmount,
      changeAmount: paymentMethod === "cash" ? Math.max(0, cashAmount - grandTotal) : 0,
    };

    setCompletedOrder(orderData);
    setPaymentModalOpen(false);
    setReceiptModalOpen(true);
    setCart([]);
    setCustomerName("");
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="h-screen bg-[#f4f5f8] dark:bg-[#0c0d10] text-zinc-900 dark:text-[#ededed] flex flex-col font-sans overflow-hidden select-none">
      
      {/* ─────────────────────────────────────────────────────────────
          1. TOP POS HEADER BAR
          ───────────────────────────────────────────────────────────── */}
      <header className="h-14 px-4 sm:px-6 bg-white dark:bg-[#14151a] border-b border-zinc-200 dark:border-white/[0.08] flex items-center justify-between shrink-0 shadow-xs z-20">
        
        {/* Left: Brand + Quick back to Portal/Back Office */}
        <div className="flex items-center gap-3">
          <Link
            href="/portal"
            className="h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-white/[0.1] bg-zinc-50 hover:bg-zinc-100 dark:bg-[#1c1d24] dark:hover:bg-[#242630] text-xs font-semibold flex items-center gap-1.5 transition-colors text-zinc-700 dark:text-zinc-200"
            title="Kembali ke Portal Hub"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Portal</span>
          </Link>

          <Link
            href="/dashboard"
            className="h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-white/[0.1] bg-zinc-50 hover:bg-zinc-100 dark:bg-[#1c1d24] dark:hover:bg-[#242630] text-xs font-semibold flex items-center gap-1.5 transition-colors text-zinc-700 dark:text-zinc-200"
            title="Buka Back Office Costing"
          >
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Back Office</span>
          </Link>

          <div className="h-4 w-[1px] bg-zinc-200 dark:bg-white/[0.08] mx-1" />

          {/* Active Outlet Pill */}
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-zinc-900 dark:text-white truncate">
              {currentOutlet?.name || "Cabang Utama"}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-[#00b5ad] font-semibold border border-teal-200 dark:border-teal-500/20">
              POS LIVE
            </span>
          </div>
        </div>

        {/* Right: Cashier Info, Live Clock & Theme Toggle */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-white/[0.05] px-2.5 py-1 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-[#00b5ad]" />
            <span>{currentTime || "00:00:00"}</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300">
            <span>Kasir:</span>
            <strong className="text-zinc-900 dark:text-white font-semibold">
              {session?.user?.name || "Operator"}
            </strong>
          </div>

          <ThemeToggle variant="icon" />
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. WORKSPACE SPLIT: LEFT CATALOG (65%) | RIGHT CART (35%)
          ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* ─────────────────────────────────────────────────────────────
            LEFT PANEL: PRODUCT SEARCH, CATEGORY PILLS & MENU GRID
            ───────────────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden p-3 sm:p-4 lg:p-5 space-y-3 sm:space-y-4">
          
          {/* Top Bar: Search + Category Pills */}
          <div className="space-y-3 shrink-0">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari menu minuman, makanan atau camilan (misal: Es Kopi, Croissant)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-zinc-200 dark:border-white/[0.1] bg-white dark:bg-[#14151a] text-xs font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#00b5ad] shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`h-8 px-3.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-[#00b5ad] text-white shadow-xs"
                      : "bg-white dark:bg-[#16171d] border border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#20222a]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

          </div>

          {/* Product Grid Area */}
          <div className="flex-1 overflow-y-auto pr-1">
            {filteredMenus.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center space-y-2">
                <p className="text-sm font-bold text-zinc-500">Menu tidak ditemukan</p>
                <p className="text-xs text-zinc-400">Coba ubah kata kunci pencarian atau pilih kategori lain.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5">
                {filteredMenus.map((item) => {
                  const marginPct = item.price > 0 ? ((item.price - item.cogs) / item.price) * 100 : 0;
                  const inCartQty = cart.find((ci) => ci.id === item.id)?.quantity || 0;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => addToCart(item)}
                      className="group relative p-3.5 rounded-xl bg-white dark:bg-[#15161c] border border-zinc-200 dark:border-white/[0.08] hover:border-[#00b5ad] dark:hover:border-[#00b5ad] text-left transition-all duration-150 shadow-2xs hover:shadow-md flex flex-col justify-between cursor-pointer active:scale-[0.98]"
                    >
                      {/* Active in-cart indicator */}
                      {inCartQty > 0 && (
                        <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#00b5ad] text-white font-mono font-bold text-[11px] flex items-center justify-center shadow-xs">
                          {inCartQty}
                        </span>
                      )}

                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 uppercase block">
                          {item.category}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white group-hover:text-[#00b5ad] transition-colors line-clamp-2 leading-snug">
                          {item.name}
                        </h4>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-white/[0.06] flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm font-bold font-mono text-zinc-900 dark:text-zinc-100">
                            {formatIDR(item.price)}
                          </p>
                          <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                            Margin {marginPct.toFixed(0)}%
                          </p>
                        </div>

                        <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-white/[0.08] group-hover:bg-[#00b5ad] text-zinc-600 dark:text-zinc-300 group-hover:text-white flex items-center justify-center transition-colors">
                          <Plus className="w-4 h-4" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* ─────────────────────────────────────────────────────────────
            RIGHT PANEL: ACTIVE ORDER BILL / CART DRAWER (35%)
            ───────────────────────────────────────────────────────────── */}
        <div className="w-full lg:w-[420px] bg-white dark:bg-[#14151a] border-t lg:border-t-0 lg:border-l border-zinc-200 dark:border-white/[0.08] flex flex-col shrink-0 shadow-lg z-10">
          
          {/* Order Header / Order Type Picker */}
          <div className="p-4 border-b border-zinc-200 dark:border-white/[0.08] space-y-3">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#00b5ad]" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Pesanan Aktif</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-white/[0.08] text-zinc-600 dark:text-zinc-300 font-bold">
                  {cart.reduce((a, b) => a + b.quantity, 0)} item
                </span>
              </div>

              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-rose-500 hover:text-rose-600 font-semibold cursor-pointer"
                >
                  Kosongkan
                </button>
              )}
            </div>

            {/* Order Type Toggle: Dine In / Takeaway / Delivery */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-[#1c1d24] border border-zinc-200 dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => setOrderType("dine_in")}
                className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  orderType === "dine_in"
                    ? "bg-white dark:bg-[#282a34] text-zinc-900 dark:text-white shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>Dine-In</span>
              </button>

              <button
                type="button"
                onClick={() => setOrderType("takeaway")}
                className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  orderType === "takeaway"
                    ? "bg-white dark:bg-[#282a34] text-zinc-900 dark:text-white shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Takeaway</span>
              </button>

              <button
                type="button"
                onClick={() => setOrderType("delivery")}
                className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  orderType === "delivery"
                    ? "bg-white dark:bg-[#282a34] text-zinc-900 dark:text-white shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                }`}
              >
                <Bike className="w-3.5 h-3.5" />
                <span>Ojol</span>
              </button>
            </div>

            {/* Table Number & Customer Name Inputs */}
            <div className="flex gap-2">
              {orderType === "dine_in" && (
                <div className="w-24">
                  <label className="text-[10px] font-bold uppercase text-zinc-500 block mb-0.5">Meja</label>
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-white/[0.1] bg-zinc-50 dark:bg-[#1a1b22] text-xs font-bold text-center focus:outline-none focus:border-[#00b5ad]"
                    placeholder="No. 01"
                  />
                </div>
              )}
              <div className="flex-1">
                <label className="text-[10px] font-bold uppercase text-zinc-500 block mb-0.5">Nama Pelanggan (Opsional)</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full h-8 px-3 rounded-lg border border-zinc-200 dark:border-white/[0.1] bg-zinc-50 dark:bg-[#1a1b22] text-xs font-medium focus:outline-none focus:border-[#00b5ad]"
                  placeholder="Contoh: Bpk. Budi"
                />
              </div>
            </div>

          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {cart.length === 0 ? (
              <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-center space-y-2 text-zinc-400">
                <ShoppingCart className="w-8 h-8 opacity-40" />
                <p className="text-xs font-medium">Belum ada item di dalam struk</p>
                <p className="text-[11px] text-zinc-500">Pilih menu dari katalog di sebelah kiri.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-zinc-50 dark:bg-[#181920] border border-zinc-200 dark:border-white/[0.06] space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h5 className="text-xs font-bold text-zinc-900 dark:text-white leading-tight">
                        {item.name}
                      </h5>
                      <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {formatIDR(item.price)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-bold font-mono text-zinc-900 dark:text-white">
                        {formatIDR(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>

                  {/* Quantity adjustment & Remove */}
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-200/60 dark:border-white/[0.04]">
                    <input
                      type="text"
                      placeholder="Catatan (e.g. Less ice)..."
                      value={item.notes || ""}
                      onChange={(e) => updateNotes(item.id, e.target.value)}
                      className="text-[11px] bg-transparent border-none focus:outline-none text-zinc-600 dark:text-zinc-400 placeholder:text-zinc-400 w-36 truncate"
                    />

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-6 h-6 rounded-md bg-white dark:bg-[#22242c] border border-zinc-200 dark:border-white/[0.1] text-zinc-700 dark:text-zinc-300 flex items-center justify-center hover:bg-zinc-100 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-mono font-bold text-xs">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-6 h-6 rounded-md bg-white dark:bg-[#22242c] border border-zinc-200 dark:border-white/[0.1] text-zinc-700 dark:text-zinc-300 flex items-center justify-center hover:bg-zinc-100 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 text-zinc-400 hover:text-rose-500 transition-colors ml-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Bottom Summary & Checkout Button */}
          <div className="p-4 border-t border-zinc-200 dark:border-white/[0.08] bg-zinc-50/50 dark:bg-[#16171e] space-y-3">
            
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>Subtotal ({cart.reduce((a, b) => a + b.quantity, 0)} item):</span>
                <span className="font-mono text-zinc-900 dark:text-white font-medium">{formatIDR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>Pajak Restoran (PB1 10%):</span>
                <span className="font-mono text-zinc-900 dark:text-white font-medium">{formatIDR(taxPb1)}</span>
              </div>
              {orderType === "dine_in" && (
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Service Charge (5%):</span>
                  <span className="font-mono text-zinc-900 dark:text-white font-medium">{formatIDR(serviceCharge)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold border-t border-zinc-200 dark:border-white/[0.08] pt-2 text-zinc-900 dark:text-white">
                <span>Total Tagihan:</span>
                <span className="font-mono text-base text-[#00b5ad]">{formatIDR(grandTotal)}</span>
              </div>
            </div>

            {/* Pay Button */}
            <button
              type="button"
              disabled={cart.length === 0}
              onClick={handleOpenPayment}
              className="w-full h-12 rounded-xl bg-[#00b5ad] hover:bg-teal-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md shadow-teal-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99]"
            >
              <span>Bayar Sekarang (F12)</span>
              <span className="font-mono font-extrabold">{formatIDR(grandTotal)}</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>

          </div>

        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          PAYMENT MODAL
          ───────────────────────────────────────────────────────────── */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-xs" onClick={() => setPaymentModalOpen(false)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#16171e] border border-zinc-200 dark:border-white/[0.1] shadow-2xl p-6 space-y-5 z-10 animate-fadeIn">
            
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-white/[0.08]">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">Pilih Metode Pembayaran</h3>
                <p className="text-xs text-zinc-500">Total yang harus dibayar pelanggan</p>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total Display */}
            <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/20 text-center">
              <span className="text-xs font-semibold text-teal-800 dark:text-teal-300">Total Pembayaran</span>
              <div className="text-3xl font-black font-mono text-[#00b5ad] mt-0.5">
                {formatIDR(grandTotal)}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  paymentMethod === "cash"
                    ? "border-[#00b5ad] bg-teal-50/50 dark:bg-teal-500/15 text-zinc-900 dark:text-white font-bold"
                    : "border-zinc-200 dark:border-white/[0.08] hover:bg-zinc-50 dark:hover:bg-[#1c1d24] text-zinc-600 dark:text-zinc-400"
                }`}
              >
                <Banknote className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
                <span className="text-xs block">Tunai (Cash)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("qris")}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  paymentMethod === "qris"
                    ? "border-[#00b5ad] bg-teal-50/50 dark:bg-teal-500/15 text-zinc-900 dark:text-white font-bold"
                    : "border-zinc-200 dark:border-white/[0.08] hover:bg-zinc-50 dark:hover:bg-[#1c1d24] text-zinc-600 dark:text-zinc-400"
                }`}
              >
                <QrCode className="w-5 h-5 mx-auto mb-1 text-amber-500" />
                <span className="text-xs block">QRIS / E-Wallet</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("edc")}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  paymentMethod === "edc"
                    ? "border-[#00b5ad] bg-teal-50/50 dark:bg-teal-500/15 text-zinc-900 dark:text-white font-bold"
                    : "border-zinc-200 dark:border-white/[0.08] hover:bg-zinc-50 dark:hover:bg-[#1c1d24] text-zinc-600 dark:text-zinc-400"
                }`}
              >
                <CreditCard className="w-5 h-5 mx-auto mb-1 text-sky-500" />
                <span className="text-xs block">Kartu EDC</span>
              </button>
            </div>

            {/* Dynamic Content by Method */}
            {paymentMethod === "cash" && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Uang Diterima dari Pelanggan:
                  </label>
                  <input
                    type="number"
                    value={cashAmount || ""}
                    onChange={(e) => setCashAmount(Number(e.target.value) || 0)}
                    className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 dark:border-white/[0.1] bg-zinc-50 dark:bg-[#1c1d24] font-mono text-base font-bold text-zinc-900 dark:text-white focus:outline-none focus:border-[#00b5ad]"
                  />
                </div>

                {/* Quick Nominal Chips */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCashAmount(grandTotal)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-white/[0.08] text-xs font-mono font-semibold hover:bg-zinc-200 cursor-pointer"
                  >
                    Uang Pas
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashAmount(50000)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-white/[0.08] text-xs font-mono font-semibold hover:bg-zinc-200 cursor-pointer"
                  >
                    50.000
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashAmount(100000)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-white/[0.08] text-xs font-mono font-semibold hover:bg-zinc-200 cursor-pointer"
                  >
                    100.000
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashAmount(200000)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-white/[0.08] text-xs font-mono font-semibold hover:bg-zinc-200 cursor-pointer"
                  >
                    200.000
                  </button>
                </div>

                {/* Change Calculation */}
                <div className="p-3 rounded-xl bg-zinc-100 dark:bg-[#1c1d24] flex items-center justify-between text-xs font-semibold">
                  <span>Kembalian:</span>
                  <span className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400">
                    {formatIDR(Math.max(0, cashAmount - grandTotal))}
                  </span>
                </div>
              </div>
            )}

            {paymentMethod === "qris" && (
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#1c1d24] text-center space-y-2">
                <div className="w-36 h-36 bg-white p-2 rounded-xl mx-auto shadow-xs border flex items-center justify-center">
                  <QrCode className="w-28 h-28 text-zinc-900" />
                </div>
                <p className="text-xs font-bold text-zinc-900 dark:text-white">QRIS Dinamis MarginOS</p>
                <p className="text-[11px] text-zinc-500">Mendukung GoPay, OVO, Dana, ShopeePay &amp; BCA Mobile</p>
              </div>
            )}

            {paymentMethod === "edc" && (
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#1c1d24] space-y-2 text-xs">
                <p className="font-semibold text-zinc-700 dark:text-zinc-300">Gesek kartu pelanggan pada mesin EDC.</p>
                <div className="flex gap-2">
                  <span className="px-2 py-1 rounded bg-white dark:bg-[#252732] border font-bold">BCA</span>
                  <span className="px-2 py-1 rounded bg-white dark:bg-[#252732] border font-bold">Mandiri</span>
                  <span className="px-2 py-1 rounded bg-white dark:bg-[#252732] border font-bold">BRI</span>
                  <span className="px-2 py-1 rounded bg-white dark:bg-[#252732] border font-bold">BNI</span>
                </div>
              </div>
            )}

            {/* Final Confirmation Button */}
            <button
              type="button"
              disabled={paymentMethod === "cash" && cashAmount < grandTotal}
              onClick={handleProcessPayment}
              className="w-full h-11 rounded-xl bg-[#00b5ad] hover:bg-teal-600 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-teal-500/20 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Selesaikan Pembayaran &amp; Cetak Struk</span>
            </button>

          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          THERMAL RECEIPT PREVIEW MODAL (58mm Style)
          ───────────────────────────────────────────────────────────── */}
      {receiptModalOpen && completedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-xs" onClick={() => setReceiptModalOpen(false)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-[#181920] border border-zinc-200 dark:border-white/[0.1] shadow-2xl p-5 space-y-4 z-10 animate-fadeIn">
            
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-white/[0.08]">
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Transaksi Berhasil!
              </span>
              <button
                type="button"
                onClick={() => setReceiptModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thermal Receipt Paper */}
            <div className="bg-white text-zinc-950 p-4 rounded-xl border border-zinc-300 font-mono text-[11px] space-y-3 shadow-inner">
              <div className="text-center space-y-0.5 border-b border-dashed border-zinc-300 pb-2">
                <h4 className="font-extrabold text-sm tracking-wide">MARGINOS RESTO</h4>
                <p className="text-[10px] text-zinc-600">{completedOrder.outletName}</p>
                <p className="text-[9px] text-zinc-500">{completedOrder.orderId} • {completedOrder.date} {completedOrder.time}</p>
                <p className="text-[9px] text-zinc-500">Kasir: {completedOrder.cashier} • {completedOrder.orderType.toUpperCase()} {completedOrder.tableNumber !== "-" ? `(Meja ${completedOrder.tableNumber})` : ""}</p>
              </div>

              {/* Items */}
              <div className="space-y-1.5 border-b border-dashed border-zinc-300 pb-2">
                {completedOrder.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-start">
                    <div className="truncate pr-2">
                      <p className="font-semibold truncate">{item.name}</p>
                      <p className="text-[9px] text-zinc-500">{item.quantity} x {formatIDR(item.price)}</p>
                    </div>
                    <span className="font-semibold shrink-0">{formatIDR(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-1 border-b border-dashed border-zinc-300 pb-2 text-[10px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatIDR(completedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>PB1 (10%):</span>
                  <span>{formatIDR(completedOrder.taxPb1)}</span>
                </div>
                {completedOrder.serviceCharge > 0 && (
                  <div className="flex justify-between">
                    <span>Service (5%):</span>
                    <span>{formatIDR(completedOrder.serviceCharge)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xs pt-1 border-t border-zinc-200">
                  <span>TOTAL:</span>
                  <span>{formatIDR(completedOrder.grandTotal)}</span>
                </div>
                <div className="flex justify-between text-zinc-600 pt-1">
                  <span>Bayar ({completedOrder.paymentMethod.toUpperCase()}):</span>
                  <span>{formatIDR(completedOrder.paymentMethod === "cash" ? completedOrder.cashAmount : completedOrder.grandTotal)}</span>
                </div>
                {completedOrder.paymentMethod === "cash" && (
                  <div className="flex justify-between text-zinc-600">
                    <span>Kembalian:</span>
                    <span>{formatIDR(completedOrder.changeAmount)}</span>
                  </div>
                )}
              </div>

              <div className="text-center text-[9px] text-zinc-500 pt-1">
                <p>Terima Kasih atas Kunjungan Anda!</p>
                <p>Powered by MarginOS F&amp;B Operating System</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="flex-1 h-10 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Struk (Print)</span>
              </button>
              <button
                type="button"
                onClick={() => setReceiptModalOpen(false)}
                className="flex-1 h-10 rounded-xl bg-[#00b5ad] hover:bg-teal-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Transaksi Baru</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}