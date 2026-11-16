"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatIDR } from "@/lib/costing-engine";
import {
  ShieldCheck,
  Building2,
  Users,
  CreditCard,
  Crown,
  Calendar,
  Phone,
  Mail,
  Search,
  Plus,
  ArrowUpRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  Trash2,
  SlidersHorizontal,
  ChevronRight,
  Store,
  Receipt,
  QrCode,
  Check,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";

interface TenantItem {
  id: string;
  name: string;
  slug: string;
  ownerName: string;
  ownerEmail: string;
  phone: string;
  subscriptionPlan: "FREE_TRIAL" | "STARTER" | "PRO" | "ENTERPRISE";
  subscriptionStatus: "ACTIVE" | "EXPIRED" | "CANCELLED" | "SUSPENDED";
  trialEndsAt: string | null;
  daysRemaining: number;
  monthlyFee: number;
  totalUsers: number;
  totalOutlets: number;
  outlets: any[];
  createdAt: string;
}

export default function SuperAdminPage() {
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [planFilter, setPlanFilter] = useState("ALL");

  // Add Tenant Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTenantForm, setNewTenantForm] = useState({
    businessName: "",
    category: "Coffee Shop",
    ownerName: "",
    email: "",
    password: "",
    phone: "",
    subscriptionPlan: "STARTER",
    durationMonths: 1,
  });

  // Edit / Action State
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);
      const [resTenants, resInvoices] = await Promise.all([
        fetch("/api/super-admin/tenants"),
        fetch("/api/billing/invoices?all=true"),
      ]);

      if (resTenants.ok) {
        const data = await resTenants.json();
        setTenants(data.tenants || []);
        setStats(data.stats || {});
      }

      if (resInvoices.ok) {
        const dataInv = await resInvoices.json();
        setInvoices(dataInv.invoices || []);
      }
    } catch (err) {
      console.error("Gagal memuat data super admin:", err);
      showToast("error", "Gagal memuat data klien dari database.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  // Create new tenant
  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await fetch("/api/super-admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTenantForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat tenant");

      showToast("success", `Klien "${newTenantForm.businessName}" berhasil didaftarkan dan diaktifkan.`);
      setIsAddModalOpen(false);
      setNewTenantForm({
        businessName: "",
        category: "Coffee Shop",
        ownerName: "",
        email: "",
        password: "",
        phone: "",
        subscriptionPlan: "STARTER",
        durationMonths: 1,
      });
      fetchTenants();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Impersonate / Switch to Client Workspace
  const handleImpersonate = async (tenant: TenantItem) => {
    try {
      const res = await fetch("/api/super-admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: tenant.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal masuk ke workspace klien");

      showToast("success", `Beralih ke akun "${tenant.name}". Mengalihkan...`);
      setTimeout(() => {
        window.location.href = "/";
      }, 600);
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  // Extend Subscription (+30 days)
  const handleExtendSubscription = async (tenant: TenantItem, days: number = 30) => {
    try {
      const res = await fetch("/api/super-admin/tenants", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tenant.id, action: "extend", extendDays: days }),
      });
      if (!res.ok) throw new Error("Gagal memperpanjang masa aktif");

      showToast("success", `Masa langganan "${tenant.name}" diperpanjang +${days} hari.`);
      fetchTenants();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  // Change Plan / Status
  const handleChangePlan = async (tenant: TenantItem, newPlan: string) => {
    try {
      const res = await fetch("/api/super-admin/tenants", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tenant.id, subscriptionPlan: newPlan, subscriptionStatus: "ACTIVE" }),
      });
      if (!res.ok) throw new Error("Gagal mengubah paket");
      showToast("success", `Paket "${tenant.name}" diubah ke ${newPlan}.`);
      fetchTenants();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  // Toggle Suspend Status
  const handleToggleSuspend = async (tenant: TenantItem) => {
    const nextStatus = tenant.subscriptionStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      const res = await fetch("/api/super-admin/tenants", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tenant.id, subscriptionStatus: nextStatus }),
      });
      if (!res.ok) throw new Error("Gagal mengubah status akses");
      showToast("success", `Status lisensi "${tenant.name}" diubah menjadi ${nextStatus}.`);
      fetchTenants();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  // Delete Tenant
  const handleDeleteTenant = async (tenant: TenantItem) => {
    if (!confirm(`Hapus seluruh data bisnis klien "${tenant.name}" secara permanen? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/super-admin/tenants?id=${tenant.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus tenant klien");
      showToast("success", `Bisnis "${tenant.name}" telah dihapus dari sistem.`);
      fetchTenants();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  // Filtered list
  const filteredTenants = tenants.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch =
      t.name.toLowerCase().includes(q) ||
      t.ownerName.toLowerCase().includes(q) ||
      t.ownerEmail.toLowerCase().includes(q) ||
      t.phone.toLowerCase().includes(q);

    let matchStatus = true;
    if (statusFilter === "ACTIVE_PAID") {
      matchStatus = t.subscriptionStatus === "ACTIVE" && t.subscriptionPlan !== "FREE_TRIAL";
    } else if (statusFilter === "TRIAL") {
      matchStatus = t.subscriptionPlan === "FREE_TRIAL";
    } else if (statusFilter === "EXPIRED_SOON") {
      matchStatus = t.daysRemaining <= 3;
    } else if (statusFilter === "SUSPENDED") {
      matchStatus = t.subscriptionStatus === "SUSPENDED" || t.subscriptionStatus === "EXPIRED";
    }

    const matchPlan = planFilter === "ALL" || t.subscriptionPlan === planFilter;

    return matchSearch && matchStatus && matchPlan;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-xl animate-in fade-in slide-in-from-top-2 duration-200 ${
            toastMessage.type === "success"
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/15 border-rose-500/30 text-rose-300"
          }`}
        >
          <span className="flex items-center gap-2">
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400" />
            )}
            {toastMessage.text}
          </span>
          <button onClick={() => setToastMessage(null)} className="text-xs opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TRANSAKSI PAYMENT GATEWAY MASUK (QRIS & VIRTUAL ACCOUNT)
          ───────────────────────────────────────────────────────────── */}
      <div className="p-5 sm:p-6 rounded-xl bg-[#19191b] border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#ededed]">
              Log Transaksi Payment Gateway Klien
            </h3>
            <p className="text-xs text-[#85858b]">
              Semua invoice tagihan yang dibuat dan dibayarkan oleh tenant secara terintegrasi
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchTenants}
            className="flex items-center gap-1.5 text-xs text-[#85858b]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Segarkan Data</span>
          </Button>
        </div>

        {invoices.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#85858b] space-y-1">
            <Receipt className="w-8 h-8 text-[#85858b] mx-auto opacity-50" />
            <p>Belum ada transaksi invoice gateway yang dibuat oleh klien.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#18181b]">
                <tr className="border-b border-white/[0.08] text-zinc-200 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">No. Invoice</th>
                  <th className="py-2.5 px-3">Nama Resto / Tenant</th>
                  <th className="py-2.5 px-3">Paket</th>
                  <th className="py-2.5 px-3">Metode Bayar</th>
                  <th className="py-2.5 px-3 text-right">Nominal</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Waktu Transaksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {invoices.map((inv) => {
                  const isPaid = inv.paymentStatus === "PAID";

                  return (
                    <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3 font-mono font-medium text-[#ededed]">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#ededed]">
                        {inv.businessName}
                      </td>
                      <td className="py-3 px-3 text-[#a1a1a6]">
                        {inv.plan} • {inv.billingCycle}
                      </td>
                      <td className="py-3 px-3 font-mono text-[#a1a1a6]">
                        {inv.paymentMethod}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#ededed]">
                        {formatIDR(inv.amount)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge variant={isPaid ? "healthy" : "warning"}>
                          {isPaid ? "LUNAS" : "PENDING"}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right text-[#85858b] font-mono text-[11px]">
                        {inv.paidAt
                          ? new Date(inv.paidAt).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })
                          : new Date(inv.createdAt).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-emerald-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              Super Admin — Platform Owner Dashboard
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Pusat kontrol seluruh kafe/klien yang berlangganan web MarginOS. Kelola lisensi, aktivasi pembayaran, dan pantau omset SaaS Anda.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/[0.1] text-xs font-semibold px-4 py-2 transition-all flex items-center gap-1.5"
          >
            ← Kembali ke Workspace
          </Link>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="rounded-full bg-white hover:bg-slate-200 text-slate-950 text-xs font-black shadow-lg shadow-white/10 px-4 py-2 transition-all"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Daftarkan Klien Baru (Direct Sales)
          </Button>
        </div>
      </div>

      {/* 4 Summary Stat Cards (MRR, Active Tenants, Trials, Follow-up) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: MRR */}
        <div className="bg-[#181920]/80 backdrop-blur-2xl rounded-3xl border border-emerald-500/30 p-4 flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <div>
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
              Estimasi MRR (Pendapatan Bulanan)
            </span>
            <div className="text-2xl font-black text-white mt-1">
              {formatIDR(stats.totalMRR || 0)}
              <span className="text-xs font-normal text-slate-400">/bln</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-medium">
              Dari {stats.activeSubscribers || 0} klien berbayar aktif
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CreditCard className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        {/* Card 2: Total Tenants */}
        <div className="bg-[#181920]/80 backdrop-blur-2xl rounded-3xl border border-white/[0.08] p-4 flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Bisnis F&amp;B Terdaftar
            </span>
            <div className="text-2xl font-black text-white mt-1">
              {stats.totalTenants || tenants.length} <span className="text-xs font-semibold text-slate-400">Klien</span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Tersebar di berbagai jenis usaha F&amp;B
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-amber-400">
            <Building2 className="w-5 h-5 text-amber-400" />
          </div>
        </div>

        {/* Card 3: Free Trials */}
        <div className="bg-[#181920]/80 backdrop-blur-2xl rounded-3xl border border-white/[0.08] p-4 flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Klien Free Trial (14 Hari)
            </span>
            <div className="text-2xl font-black text-amber-400 mt-1">
              {stats.trialCount || 0} <span className="text-xs font-semibold text-slate-400">Klien</span>
            </div>
            <span className="text-[11px] text-amber-400/80 font-medium">
              Potensi konversi ke paket berbayar
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
        </div>

        {/* Card 4: Expired / Need Action */}
        <div className="bg-[#181920]/80 backdrop-blur-2xl rounded-3xl border border-rose-500/20 p-4 flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <div>
            <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block">
              Perlu Ditagih / Expired
            </span>
            <div className="text-2xl font-black text-rose-400 mt-1">
              {stats.expiredCount || 0} <span className="text-xs font-semibold text-slate-400">Klien</span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Kirim invoice WhatsApp perpanjangan
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#181920]/80 backdrop-blur-2xl rounded-2xl border border-white/[0.08] p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Cari nama resto, owner, email, WA..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs bg-white/[0.04] border-white/[0.08] text-white rounded-xl focus:border-amber-500/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-white/[0.04] border-white/[0.08] text-white rounded-xl"
          >
            <option value="ALL" className="bg-[#181920]">Semua Status</option>
            <option value="ACTIVE_PAID" className="bg-[#181920]">Aktif Berbayar (Starter/Pro)</option>
            <option value="TRIAL" className="bg-[#181920]">Free Trial</option>
            <option value="EXPIRED_SOON" className="bg-[#181920]">Masa Aktif ≤ 3 Hari</option>
            <option value="SUSPENDED" className="bg-[#181920]">Expired / Suspended</option>
          </Select>

          <Select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="text-xs bg-white/[0.04] border-white/[0.08] text-white rounded-xl"
          >
            <option value="ALL" className="bg-[#181920]">Semua Paket</option>
            <option value="FREE_TRIAL" className="bg-[#181920]">Free Trial</option>
            <option value="STARTER" className="bg-[#181920]">Starter (Rp 149k)</option>
            <option value="PRO" className="bg-[#181920]">Pro (Rp 299k)</option>
            <option value="ENTERPRISE" className="bg-[#181920]">Enterprise (Rp 599k)</option>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchTenants}
            className="rounded-xl border-white/[0.08] text-slate-300 hover:text-white text-xs h-9"
            title="Muat Ulang Data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Tenants Table */}
      {loading ? (
        <div className="p-16 text-center text-slate-400">
          <div className="inline-block w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
          <div className="text-xs font-medium">Memuat direktori klien SaaS...</div>
        </div>
      ) : filteredTenants.length === 0 ? (
        <Card className="p-10 text-center text-slate-400 bg-[#181920]/80 border-white/[0.08] rounded-3xl text-xs">
          Tidak ada klien yang cocok dengan filter.
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-white/[0.08] bg-[#181920]/80 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
          <table className="w-full text-xs divide-y divide-white/[0.08]">
            <thead className="bg-[#18181b] text-zinc-200 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3.5 text-left w-12">No</th>
                <th className="p-3.5 text-left">Nama Usaha Klien</th>
                <th className="p-3.5 text-left">Pemilik &amp; WhatsApp</th>
                <th className="p-3.5 text-left">Paket Lisensi</th>
                <th className="p-3.5 text-left">Status</th>
                <th className="p-3.5 text-left">Masa Berlaku</th>
                <th className="p-3.5 text-left">Outlet / Staf</th>
                <th className="p-3.5 text-right pr-4">Kontrol Lisensi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredTenants.map((t, idx) => {
                const isExpired = t.daysRemaining < 0;
                const isExpiringSoon = t.daysRemaining >= 0 && t.daysRemaining <= 3;
                const cleanPhone = t.phone.replace(/[^0-9]/g, "");
                const waLink = cleanPhone ? `https://wa.me/${cleanPhone.startsWith("0") ? "62" + cleanPhone.slice(1) : cleanPhone}?text=Halo%20${encodeURIComponent(t.ownerName)}%2C%20dari%20MarginOS%20terkait%20layanan%20aplikasi%20${encodeURIComponent(t.name)}` : "#";

                return (
                  <tr key={t.id} className="hover:bg-white/[0.04] transition-colors">
                    <td className="p-3.5 text-zinc-400 font-bold">{idx + 1}</td>
                    
                    {/* Business Name */}
                    <td className="p-3.5">
                      <div className="font-bold text-white text-xs flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        {t.name}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        slug: {t.slug}
                      </span>
                    </td>

                    {/* Owner & WhatsApp */}
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-200">{t.ownerName}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                          title="Chat WhatsApp"
                        >
                          <Phone className="w-3 h-3" />
                          {t.phone}
                        </a>
                      </div>
                    </td>

                    {/* Subscription Plan */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          className={`text-[10px] font-bold rounded-full ${
                            t.subscriptionPlan === "PRO"
                              ? "bg-orange-500/20 text-orange-300 border-orange-500/30"
                              : t.subscriptionPlan === "STARTER"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                              : "bg-white/[0.08] text-slate-300 border-white/[0.1]"
                          }`}
                        >
                          {t.subscriptionPlan}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {t.monthlyFee > 0 ? `${formatIDR(t.monthlyFee)}/bln` : "Gratis"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-3.5">
                      <Badge
                        className={`text-[10px] font-bold rounded-full ${
                          t.subscriptionStatus === "ACTIVE"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : t.subscriptionStatus === "SUSPENDED"
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                            : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        }`}
                      >
                        {t.subscriptionStatus === "ACTIVE" ? "AKTIF" : t.subscriptionStatus}
                      </Badge>
                    </td>

                    {/* Days Remaining */}
                    <td className="p-3.5">
                      {isExpired ? (
                        <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Kedaluwarsa ({Math.abs(t.daysRemaining)} hr lalu)
                        </span>
                      ) : isExpiringSoon ? (
                        <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Sisa {t.daysRemaining} hari
                        </span>
                      ) : (
                        <span className="text-[11px] text-emerald-400 font-semibold">
                          Sisa {t.daysRemaining} hari
                        </span>
                      )}
                      {t.trialEndsAt && (
                        <span className="text-[10px] text-slate-500 block">
                          s/d {new Date(t.trialEndsAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      )}
                    </td>

                    {/* Outlets & Users count */}
                    <td className="p-3.5 text-slate-300 text-[11px]">
                      <div>{t.totalOutlets} Outlet</div>
                      <div className="text-slate-500">{t.totalUsers} Pengguna</div>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right pr-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Extend +30 Days Button */}
                        <Button
                          size="sm"
                          onClick={() => handleExtendSubscription(t, 30)}
                          className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold h-7 px-2.5 rounded-full"
                          title="Perpanjang 30 hari"
                        >
                          +30 Hari
                        </Button>

                        {/* Plan Dropdown */}
                        <Select
                          value={t.subscriptionPlan}
                          onChange={(e) => handleChangePlan(t, e.target.value)}
                          className="text-[10px] bg-white/[0.05] border-white/[0.1] text-white rounded-lg h-7 px-1.5"
                        >
                          <option value="FREE_TRIAL" className="bg-[#181920]">Trial</option>
                          <option value="STARTER" className="bg-[#181920]">Starter</option>
                          <option value="PRO" className="bg-[#181920]">Pro</option>
                          <option value="ENTERPRISE" className="bg-[#181920]">Enterprise</option>
                        </Select>

                        {/* Suspend / Resume Button */}
                        <button
                          onClick={() => handleToggleSuspend(t)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer text-xs ${
                            t.subscriptionStatus === "ACTIVE"
                              ? "text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                              : "text-emerald-400 hover:bg-emerald-500/10"
                          }`}
                          title={t.subscriptionStatus === "ACTIVE" ? "Bekukan Akses (Suspend)" : "Buka Akses"}
                        >
                          {t.subscriptionStatus === "ACTIVE" ? "Suspend" : "Aktifkan"}
                        </button>

                        {/* Impersonate Button */}
                        <button
                          onClick={() => handleImpersonate(t)}
                          className="p-1.5 text-amber-400 hover:text-white hover:bg-amber-500/20 rounded-lg cursor-pointer transition-colors"
                          title="Masuk ke Akun Klien (Kelola Workspace)"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteTenant(t)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-colors"
                          title="Hapus Klien"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TRANSAKSI PAYMENT GATEWAY MASUK (QRIS & VIRTUAL ACCOUNT)
          ───────────────────────────────────────────────────────────── */}
      <div className="p-5 sm:p-6 rounded-xl bg-[#19191b] border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#ededed]">
              Log Transaksi Payment Gateway Klien
            </h3>
            <p className="text-xs text-[#85858b]">
              Semua invoice tagihan yang dibuat dan dibayarkan oleh tenant secara terintegrasi
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchTenants}
            className="flex items-center gap-1.5 text-xs text-[#85858b]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Segarkan Data</span>
          </Button>
        </div>

        {invoices.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#85858b] space-y-1">
            <Receipt className="w-8 h-8 text-[#85858b] mx-auto opacity-50" />
            <p>Belum ada transaksi invoice gateway yang dibuat oleh klien.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#18181b]">
                <tr className="border-b border-white/[0.08] text-zinc-200 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">No. Invoice</th>
                  <th className="py-2.5 px-3">Nama Resto / Tenant</th>
                  <th className="py-2.5 px-3">Paket</th>
                  <th className="py-2.5 px-3">Metode Bayar</th>
                  <th className="py-2.5 px-3 text-right">Nominal</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Waktu Transaksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {invoices.map((inv) => {
                  const isPaid = inv.paymentStatus === "PAID";

                  return (
                    <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3 font-mono font-medium text-[#ededed]">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#ededed]">
                        {inv.businessName}
                      </td>
                      <td className="py-3 px-3 text-[#a1a1a6]">
                        {inv.plan} • {inv.billingCycle}
                      </td>
                      <td className="py-3 px-3 font-mono text-[#a1a1a6]">
                        {inv.paymentMethod}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#ededed]">
                        {formatIDR(inv.amount)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge variant={isPaid ? "healthy" : "warning"}>
                          {isPaid ? "LUNAS" : "PENDING"}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right text-[#85858b] font-mono text-[11px]">
                        {inv.paidAt
                          ? new Date(inv.paidAt).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })
                          : new Date(inv.createdAt).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Daftarkan Klien Baru (Direct B2B Sales) */}
      <Dialog
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        maxWidth="lg"
        title="Daftarkan Klien Baru (Direct Sales / Manual)"
        description="Buat akun tenant untuk klien yang mendaftar langsung atau sudah mentransfer biaya langganan."
      >
        <form onSubmit={handleCreateTenant} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Nama Usaha F&amp;B *</Label>
              <Input
                required
                value={newTenantForm.businessName}
                onChange={(e) => setNewTenantForm({ ...newTenantForm, businessName: e.target.value })}
                placeholder="Misal: Kopi Ruang Hati, Bakmi Sedap 88"
                className="text-xs bg-[#16171d] border-white/[0.1] text-white rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Kategori Bisnis</Label>
              <Select
                value={newTenantForm.category}
                onChange={(e) => setNewTenantForm({ ...newTenantForm, category: e.target.value })}
                className="text-xs bg-[#16171d] border-white/[0.1] text-white rounded-xl"
              >
                <option value="Coffee Shop" className="bg-[#16171d]">Coffee Shop / Kafe</option>
                <option value="Restaurant" className="bg-[#16171d]">Restoran / Rumah Makan</option>
                <option value="Bakery" className="bg-[#16171d]">Bakery &amp; Pastry</option>
                <option value="Cloud Kitchen" className="bg-[#16171d]">Cloud Kitchen / Delivery Only</option>
                <option value="Catering" className="bg-[#16171d]">Katering &amp; Event</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Nama Pemilik / Owner *</Label>
              <Input
                required
                value={newTenantForm.ownerName}
                onChange={(e) => setNewTenantForm({ ...newTenantForm, ownerName: e.target.value })}
                placeholder="Misal: Ibu Sarah, Pak Budi"
                className="text-xs bg-[#16171d] border-white/[0.1] text-white rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">No. WhatsApp Klien *</Label>
              <Input
                required
                value={newTenantForm.phone}
                onChange={(e) => setNewTenantForm({ ...newTenantForm, phone: e.target.value })}
                placeholder="Misal: 081234567890"
                className="text-xs bg-[#16171d] border-white/[0.1] text-white rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Email Login Klien *</Label>
              <Input
                required
                type="email"
                value={newTenantForm.email}
                onChange={(e) => setNewTenantForm({ ...newTenantForm, email: e.target.value })}
                placeholder="owner@klienresto.com"
                className="text-xs bg-[#16171d] border-white/[0.1] text-white rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Password Awal *</Label>
              <Input
                required
                type="password"
                value={newTenantForm.password}
                onChange={(e) => setNewTenantForm({ ...newTenantForm, password: e.target.value })}
                placeholder="Minimal 6 karakter"
                className="text-xs bg-[#16171d] border-white/[0.1] text-white rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Paket Lisensi Berlangganan</Label>
              <Select
                value={newTenantForm.subscriptionPlan}
                onChange={(e) => setNewTenantForm({ ...newTenantForm, subscriptionPlan: e.target.value })}
                className="text-xs bg-[#16171d] border-white/[0.1] text-white rounded-xl"
              >
                <option value="STARTER" className="bg-[#16171d]">Starter (Rp 149.000 / bln)</option>
                <option value="PRO" className="bg-[#16171d]">Pro &amp; Multi-Outlet (Rp 299.000 / bln)</option>
                <option value="ENTERPRISE" className="bg-[#16171d]">Enterprise (Rp 599.000 / bln)</option>
                <option value="FREE_TRIAL" className="bg-[#16171d]">Free Trial (14 Hari)</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Durasi Berlangganan Langsung</Label>
              <Select
                value={newTenantForm.durationMonths}
                onChange={(e) => setNewTenantForm({ ...newTenantForm, durationMonths: parseInt(e.target.value, 10) })}
                className="text-xs bg-[#16171d] border-white/[0.1] text-white rounded-xl"
              >
                <option value={1} className="bg-[#16171d]">1 Bulan (30 Hari)</option>
                <option value={3} className="bg-[#16171d]">3 Bulan (90 Hari)</option>
                <option value={6} className="bg-[#16171d]">6 Bulan (180 Hari)</option>
                <option value={12} className="bg-[#16171d]">1 Tahun (365 Hari)</option>
              </Select>
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.08] flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              className="rounded-full border-white/[0.1] text-slate-300 text-xs px-4"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={actionLoading}
              className="rounded-full bg-white hover:bg-slate-200 text-slate-950 font-black text-xs px-5 shadow-lg shadow-white/10"
            >
              {actionLoading ? "Memproses..." : "Aktifkan Akun Klien"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
