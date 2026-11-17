"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOutlet } from "@/context/OutletContext";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  Settings,
  Store,
  Users,
  Printer,
  Receipt,
  CreditCard,
  Shield,
  Save,
  CheckCircle2,
  ArrowLeft,
  Layers,
  Sparkles,
  Phone,
  MapPin,
  Clock,
  Sliders,
  DollarSign,
  Building2,
  ExternalLink,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { outlets, currentOutlet, setCurrentOutlet } = useOutlet();
  const [activeTab, setActiveTab] = useState<"general" | "tax" | "staff" | "hardware" | "billing">("general");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form states
  const [outletName, setOutletName] = useState("");
  const [address, setAddress] = useState("Jl. Senopati No. 45, Kebayoran Baru, Jakarta Selatan");
  const [phone, setPhone] = useState("+62 812-3456-7890");
  const [taxPb1, setTaxPb1] = useState(10);
  const [serviceCharge, setServiceCharge] = useState(5);
  const [targetFoodCost, setTargetFoodCost] = useState(30);
  const [autoDeductStock, setAutoDeductStock] = useState(true);
  const [printerPaper, setPrinterPaper] = useState<"58mm" | "80mm">("58mm");
  const [printerConnection, setPrinterConnection] = useState("bluetooth");
  const [receiptFooter, setReceiptFooter] = useState("Terima Kasih atas Kunjungan Anda! Follow IG: @marginos.resto");

  useEffect(() => {
    if (currentOutlet) {
      setOutletName(currentOutlet.name || "Kopi Kenangan Senopati");
      setTargetFoodCost(currentOutlet.targetFoodCostPercent || 30);
    }
  }, [currentOutlet]);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb] dark:bg-[#0d0e12] text-zinc-900 dark:text-[#ededed] flex flex-col font-sans transition-colors duration-200">
      
      {/* ─────────────────────────────────────────────────────────────
          TOP SETTINGS HEADER
          ───────────────────────────────────────────────────────────── */}
      <header className="h-16 px-4 sm:px-8 border-b border-zinc-200 dark:border-white/[0.08] bg-white/90 dark:bg-[#14151a]/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between transition-colors">
        
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/portal"
            className="h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-white/[0.1] bg-zinc-50 hover:bg-zinc-100 dark:bg-[#1c1d24] dark:hover:bg-[#242630] text-xs font-semibold flex items-center gap-1.5 transition-colors text-zinc-700 dark:text-zinc-200"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Portal Modul</span>
          </Link>

          <Link
            href="/dashboard"
            className="h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-white/[0.1] bg-zinc-50 hover:bg-zinc-100 dark:bg-[#1c1d24] dark:hover:bg-[#242630] text-xs font-semibold flex items-center gap-1.5 transition-colors text-zinc-700 dark:text-zinc-200"
          >
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Back Office</span>
          </Link>

          <div className="h-4 w-[1px] bg-zinc-200 dark:bg-white/[0.08]" />

          <div>
            <h1 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white leading-tight">
              Pengaturan Sistem &amp; Outlet
            </h1>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
              Cabang: <strong className="text-zinc-800 dark:text-zinc-200">{currentOutlet?.name}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle variant="icon" />

          <button
            type="button"
            onClick={handleSave}
            className="h-9 px-4 rounded-xl bg-[#00b5ad] hover:bg-teal-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-teal-500/20 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Simpan Perubahan</span>
          </button>
        </div>
      </header>

      {/* Save Success Alert Banner */}
      {savedSuccess && (
        <div className="bg-emerald-500 text-white text-xs font-bold py-2.5 px-4 text-center flex items-center justify-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4" />
          <span>Pengaturan outlet berhasil disimpan dan diterapkan!</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SETTINGS WORKSPACE
          ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 lg:p-10 space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 border-b border-zinc-200 dark:border-white/[0.08] pb-1 overflow-x-auto no-scrollbar">
          
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`h-9 px-4 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "general"
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.05]"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Profil Outlet &amp; Bisnis</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tax")}
            className={`h-9 px-4 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "tax"
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.05]"
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Pajak, Service &amp; HPP</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("staff")}
            className={`h-9 px-4 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "staff"
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.05]"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Staf &amp; Hak Akses (RBAC)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("hardware")}
            className={`h-9 px-4 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "hardware"
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.05]"
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Printer &amp; Struk Kasir</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("billing")}
            className={`h-9 px-4 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "billing"
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.05]"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Langganan &amp; Billing</span>
          </button>

        </div>

        {/* Tab 1: General Outlet Profile */}
        {activeTab === "general" && (
          <div className="p-6 rounded-2xl bg-white dark:bg-[#15161c] border border-zinc-200 dark:border-white/[0.08] shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">Identitas Cabang &amp; Outlet</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Informasi toko yang akan tercetak pada struk kasir dan laporan operasional.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Nama Outlet / Cabang</label>
                <input
                  type="text"
                  value={outletName}
                  onChange={(e) => setOutletName(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 dark:border-white/[0.1] bg-zinc-50 dark:bg-[#1b1c22] text-xs font-semibold text-zinc-900 dark:text-white focus:outline-none focus:border-[#00b5ad]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Nomor Kontak / WhatsApp Toko</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 dark:border-white/[0.1] bg-zinc-50 dark:bg-[#1b1c22] text-xs font-semibold text-zinc-900 dark:text-white focus:outline-none focus:border-[#00b5ad]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Alamat Lengkap Outlet</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-3 rounded-xl border border-zinc-200 dark:border-white/[0.1] bg-zinc-50 dark:bg-[#1b1c22] text-xs font-medium text-zinc-900 dark:text-white focus:outline-none focus:border-[#00b5ad]"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 dark:border-white/[0.06] flex items-center justify-between">
              <span className="text-xs text-zinc-500">Ingin menambah atau mengelola multi-cabang lainnya?</span>
              <Link
                href="/outlets"
                className="text-xs font-bold text-[#00b5ad] hover:underline flex items-center gap-1"
              >
                <span>Kelola Semua Cabang di Modul Outlet</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}

        {/* Tab 2: Tax, Service & Food Cost Target */}
        {activeTab === "tax" && (
          <div className="p-6 rounded-2xl bg-white dark:bg-[#15161c] border border-zinc-200 dark:border-white/[0.08] shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">Pajak Restoran, Service &amp; Kebijakan HPP</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Aturan penghitungan tagihan di kasir POS dan batas aman margin food cost.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Pajak Restoran (PB1)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={taxPb1}
                    onChange={(e) => setTaxPb1(Number(e.target.value))}
                    className="w-full h-10 px-3.5 pr-8 rounded-xl border border-zinc-200 dark:border-white/[0.1] bg-zinc-50 dark:bg-[#1b1c22] text-xs font-bold font-mono focus:outline-none focus:border-[#00b5ad]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">%</span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Diterapkan otomatis pada setiap transaksi POS.</p>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Service Charge (Dine-In)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={serviceCharge}
                    onChange={(e) => setServiceCharge(Number(e.target.value))}
                    className="w-full h-10 px-3.5 pr-8 rounded-xl border border-zinc-200 dark:border-white/[0.1] bg-zinc-50 dark:bg-[#1b1c22] text-xs font-bold font-mono focus:outline-none focus:border-[#00b5ad]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">%</span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Hanya dikenakan untuk pesanan makan di tempat.</p>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Target Ambang Batas Food Cost</label>
                <div className="relative">
                  <input
                    type="number"
                    value={targetFoodCost}
                    onChange={(e) => setTargetFoodCost(Number(e.target.value))}
                    className="w-full h-10 px-3.5 pr-8 rounded-xl border border-zinc-200 dark:border-white/[0.1] bg-zinc-50 dark:bg-[#1b1c22] text-xs font-bold font-mono focus:outline-none focus:border-[#00b5ad]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">%</span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Menu di atas persentase ini akan ditandai evaluasi.</p>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 dark:border-white/[0.06] flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white">Potong Stok Bahan Otomatis dari POS</h4>
                <p className="text-[11px] text-zinc-500">Kurangi saldo bahan baku saat pesanan menu berhasil diselesaikan di kasir POS.</p>
              </div>
              <input
                type="checkbox"
                checked={autoDeductStock}
                onChange={(e) => setAutoDeductStock(e.target.checked)}
                className="w-4 h-4 accent-[#00b5ad] cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Tab 3: Staff & RBAC */}
        {activeTab === "staff" && (
          <div className="p-6 rounded-2xl bg-white dark:bg-[#15161c] border border-zinc-200 dark:border-white/[0.08] shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">Tim &amp; Pembagian Hak Akses (RBAC)</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Batasi kewenangan tiap staf berdasarkan tugasnya (Owner, Manager, Chef, Kasir).</p>
              </div>
              <Link
                href="/admin"
                className="h-8 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-xs flex items-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Kelola di User Admin</span>
              </Link>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#1b1c22] border border-zinc-200 dark:border-white/[0.06] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white">Role: Owner / Pemilik Usaha</h4>
                  <p className="text-[11px] text-zinc-500">Akses penuh ke laporan keuangan, laba rugi, penentuan harga, dan pengaturan akun.</p>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-amber-500/10 text-amber-500 font-bold border border-amber-500/20">FULL ACCESS</span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#1b1c22] border border-zinc-200 dark:border-white/[0.06] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white">Role: Chef / Kepala Dapur</h4>
                  <p className="text-[11px] text-zinc-500">Dapat mengelola resep, sub-resep, stok bahan mentah, dan cetak lembar SOP dapur.</p>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-teal-500/10 text-[#00b5ad] font-bold border border-teal-500/20">KITCHEN ONLY</span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#1b1c22] border border-zinc-200 dark:border-white/[0.06] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white">Role: Kasir / Barista Front-of-House</h4>
                  <p className="text-[11px] text-zinc-500">Akses cepat terminal kasir POS untuk input order &amp; terima bayar tanpa akses melihat rahasia HPP.</p>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-sky-500/10 text-sky-500 font-bold border border-sky-500/20">POS TERMINAL</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Hardware & Thermal Receipt Printer */}
        {activeTab === "hardware" && (
          <div className="p-6 rounded-2xl bg-white dark:bg-[#15161c] border border-zinc-200 dark:border-white/[0.08] shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">Printer Kasir &amp; Format Struk</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Konfigurasi perangkat cetak thermal dan pesan ucapan struk kasir POS.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Ukuran Kertas Thermal</label>
                <select
                  value={printerPaper}
                  onChange={(e: any) => setPrinterPaper(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 dark:border-white/[0.1] bg-zinc-50 dark:bg-[#1b1c22] text-xs font-semibold focus:outline-none focus:border-[#00b5ad]"
                >
                  <option value="58mm">Thermal 58 mm (Standar POS Portabel / Bluetooth)</option>
                  <option value="80mm">Thermal 80 mm (Standar POS Desktop / Restoran Besar)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Koneksi Printer</label>
                <select
                  value={printerConnection}
                  onChange={(e) => setPrinterConnection(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 dark:border-white/[0.1] bg-zinc-50 dark:bg-[#1b1c22] text-xs font-semibold focus:outline-none focus:border-[#00b5ad]"
                >
                  <option value="bluetooth">Bluetooth Thermal Printer (Android / iOS)</option>
                  <option value="usb">USB Direct Thermal Printer (Windows / POS PC)</option>
                  <option value="lan">LAN Ethernet / Wi-Fi Kitchen Printer</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Pesan Footer Struk Kasir</label>
                <input
                  type="text"
                  value={receiptFooter}
                  onChange={(e) => setReceiptFooter(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 dark:border-white/[0.1] bg-zinc-50 dark:bg-[#1b1c22] text-xs font-medium focus:outline-none focus:border-[#00b5ad]"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 dark:border-white/[0.06] flex items-center justify-between">
              <span className="text-xs text-zinc-500">Cek respon printer kasir sebelum operasional dimulai:</span>
              <button
                type="button"
                onClick={() => window.print()}
                className="h-8 px-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-[#20222a] dark:hover:bg-[#282a34] text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Uji Coba (Test Print)</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 5: Billing & Subscription */}
        {activeTab === "billing" && (
          <div className="p-6 rounded-2xl bg-white dark:bg-[#15161c] border border-zinc-200 dark:border-white/[0.08] shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">Status Paket Langganan MarginOS</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Informasi lisensi aktif outlet F&amp;B Anda.</p>
            </div>

            <div className="p-5 rounded-2xl bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00b5ad] text-white font-bold uppercase">
                  PAKET AKTIF
                </span>
                <h4 className="text-lg font-extrabold text-zinc-900 dark:text-white mt-1">MarginOS Pro Resto Multi-Outlet</h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">Mendukung tak terbatas resep, bahan baku, kasir POS, dan multi-cabang.</p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs text-zinc-500 block">Status Akun:</span>
                <strong className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">Aktif (14 Hari Trial)</strong>
              </div>
            </div>
          </div>
        )}

      </main>

    </div>
  );
}