"use client";

import React, { useState, useEffect, useCallback } from "react";
import { formatIDR } from "@/lib/costing-engine";
import {
  Users,
  ShieldCheck,
  UserPlus,
  Building2,
  Crown,
  KeyRound,
  Trash2,
  CheckCircle2,
  XCircle,
  Briefcase,
  Phone,
  Mail,
  Search,
  Plus,
  BadgePercent,
  Sparkles,
  UserCheck,
  CreditCard,
  Store,
  Layers,
  QrCode,
  Receipt,
  Copy,
  Check,
  Clock,
  RefreshCw,
  AlertCircle,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "MANAGER" | "STAFF";
  status: "ACTIVE" | "SUSPENDED";
  phone: string | null;
  createdAt: string;
}

interface CrmCustomerItem {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  category: "VIP" | "CATERING_B2B" | "CORPORATE" | "REGULAR" | "EVENT";
  status: "ACTIVE" | "PROSPECT" | "INACTIVE";
  totalSpent: number;
  totalOrders: number;
  notes: string | null;
  lastContact: string | null;
}

interface BusinessInfo {
  id: string;
  name: string;
  ownerName: string | null;
  phone: string | null;
  subscriptionPlan: "FREE_TRIAL" | "STARTER" | "PRO" | "ENTERPRISE";
  subscriptionStatus: "ACTIVE" | "EXPIRED" | "CANCELLED";
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<string>("users");
  const [loading, setLoading] = useState(true);

  // Users State
  const [users, setUsers] = useState<UserItem[]>([]);
  const [userStats, setUserStats] = useState<any>({});
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("ALL");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "STAFF",
    phone: "",
  });

  // CRM State
  const [customers, setCustomers] = useState<CrmCustomerItem[]>([]);
  const [crmStats, setCrmStats] = useState<any>({});
  const [crmSearch, setCrmSearch] = useState("");
  const [crmCategoryFilter, setCrmCategoryFilter] = useState("ALL");
  const [isAddCrmOpen, setIsAddCrmOpen] = useState(false);
  const [newCrmForm, setNewCrmForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    category: "CORPORATE",
    notes: "",
    totalSpent: 0,
    totalOrders: 0,
  });

  // Business / SaaS Plan State
  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [businessSaving, setBusinessSaving] = useState(false);

  // Integrated Billing & Payment Gateway State
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<"STARTER" | "PRO">("STARTER");
  const [checkoutCycle, setCheckoutCycle] = useState<"MONTHLY" | "ANNUALLY">("MONTHLY");
  const [checkoutMethod, setCheckoutMethod] = useState<"QRIS" | "VA_BCA" | "VA_MANDIRI" | "VA_BRI">("QRIS");
  const [activeInvoice, setActiveInvoice] = useState<any | null>(null);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Alert Feedback
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showNotification = (type: "success" | "error", text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 4000);
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Fetch Data
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [uRes, cRes, bRes, iRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/crm"),
        fetch("/api/admin/business"),
        fetch("/api/billing/invoices"),
      ]);

      if (uRes.ok) {
        const uData = await uRes.json();
        setUsers(uData.users || []);
        setUserStats(uData.stats || {});
      }

      if (cRes.ok) {
        const cData = await cRes.json();
        setCustomers(cData.customers || []);
        setCrmStats(cData.stats || {});
      }

      if (bRes.ok) {
        const bData = await bRes.json();
        setBusiness(bData.business || null);
      }

      if (iRes.ok) {
        const iData = await iRes.json();
        setInvoices(iData.invoices || []);
      }
    } catch (err) {
      console.error("Gagal memuat data admin:", err);
      showNotification("error", "Gagal memuat data dari server.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Real-time polling when modal has an active pending invoice
  useEffect(() => {
    if (!activeInvoice || activeInvoice.paymentStatus !== "PENDING") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/billing/check-status?invoiceId=${activeInvoice.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.paymentStatus === "PAID") {
            setActiveInvoice((prev: any) => ({ ...prev, paymentStatus: "PAID", paidAt: data.paidAt }));
            showNotification("success", "Pembayaran terkonfirmasi! Masa aktif lisensi berhasil diperpanjang.");
            fetchAllData();
          }
        }
      } catch (err) {
        console.error("Polling status error:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activeInvoice, fetchAllData]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Handle Add User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUserForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat pengguna");

      showNotification("success", `Akun "${data.user.name}" berhasil dibuat.`);
      setIsAddUserOpen(false);
      setNewUserForm({ name: "", email: "", password: "", role: "STAFF", phone: "" });
      fetchAllData();
    } catch (err: any) {
      showNotification("error", err.message);
    }
  };

  // Handle Toggle User Status
  const handleToggleUserStatus = async (user: UserItem) => {
    const nextStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, status: nextStatus }),
      });
      if (!res.ok) throw new Error("Gagal mengubah status akun");
      showNotification("success", `Status akun ${user.name} diubah menjadi ${nextStatus}.`);
      fetchAllData();
    } catch (err: any) {
      showNotification("error", err.message);
    }
  };

  // Handle Change User Role
  const handleChangeRole = async (user: UserItem, newRole: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, role: newRole }),
      });
      if (!res.ok) throw new Error("Gagal memperbarui hak akses");
      showNotification("success", `Hak akses ${user.name} diperbarui ke ${newRole}.`);
      fetchAllData();
    } catch (err: any) {
      showNotification("error", err.message);
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (user: UserItem) => {
    if (!confirm(`Hapus akun pengguna "${user.name}" secara permanen?`)) return;
    try {
      const res = await fetch(`/api/admin/users?id=${user.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus pengguna");
      showNotification("success", `Pengguna "${user.name}" telah dihapus.`);
      fetchAllData();
    } catch (err: any) {
      showNotification("error", err.message);
    }
  };

  // Handle Add CRM Customer
  const handleCreateCrm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCrmForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menambahkan kontak CRM");

      showNotification("success", `Kontak CRM "${data.customer.name}" berhasil dicatat.`);
      setIsAddCrmOpen(false);
      setNewCrmForm({
        name: "",
        company: "",
        email: "",
        phone: "",
        category: "CORPORATE",
        notes: "",
        totalSpent: 0,
        totalOrders: 0,
      });
      fetchAllData();
    } catch (err: any) {
      showNotification("error", err.message);
    }
  };

  // Handle Delete CRM Customer
  const handleDeleteCrm = async (cust: CrmCustomerItem) => {
    if (!confirm(`Hapus data klien "${cust.name}" dari CRM?`)) return;
    try {
      const res = await fetch(`/api/admin/crm?id=${cust.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus kontak CRM");
      showNotification("success", `Data CRM "${cust.name}" telah dihapus.`);
      fetchAllData();
    } catch (err: any) {
      showNotification("error", err.message);
    }
  };

  // Handle Update Subscription Plan Simulator
  const handleUpdatePlan = async (newPlan: string) => {
    try {
      setBusinessSaving(true);
      const res = await fetch("/api/admin/business", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionPlan: newPlan, subscriptionStatus: "ACTIVE" }),
      });
      if (!res.ok) throw new Error("Gagal memperbarui paket langganan");
      showNotification("success", `Paket lisensi MarginOS berhasil dialihkan ke ${newPlan}.`);
      fetchAllData();
    } catch (err: any) {
      showNotification("error", err.message);
    } finally {
      setBusinessSaving(false);
    }
  };

  // Open checkout modal
  const handleOpenCheckout = (plan: "STARTER" | "PRO" = "STARTER") => {
    setCheckoutPlan(plan);
    setActiveInvoice(null);
    setIsCheckoutModalOpen(true);
  };

  // Generate real subscription invoice
  const handleGenerateInvoice = async () => {
    try {
      setIsGeneratingInvoice(true);
      const res = await fetch("/api/billing/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: checkoutPlan,
          billingCycle: checkoutCycle,
          paymentMethod: checkoutMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat invoice tagihan");

      setActiveInvoice(data.invoice);
      showNotification("success", `Invoice ${data.invoice.invoiceNumber} siap dibayar.`);
      fetchAllData();
    } catch (err: any) {
      showNotification("error", err.message);
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  // Simulate instant payment success (sandbox mode)
  const handleSimulatePayment = async (invoiceId: string) => {
    try {
      setIsSimulating(true);
      const res = await fetch("/api/billing/simulate-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memproses simulasi");

      showNotification("success", data.message);
      if (activeInvoice && activeInvoice.id === invoiceId) {
        setActiveInvoice({ ...activeInvoice, paymentStatus: "PAID", paidAt: new Date().toISOString() });
      }
      fetchAllData();
    } catch (err: any) {
      showNotification("error", err.message);
    } finally {
      setIsSimulating(false);
    }
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.phone && u.phone.includes(userSearch));
    const matchRole = userRoleFilter === "ALL" || u.role === userRoleFilter;
    return matchSearch && matchRole;
  });

  // Filtered CRM Customers
  const filteredCustomers = customers.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(crmSearch.toLowerCase()) ||
      (c.company && c.company.toLowerCase().includes(crmSearch.toLowerCase())) ||
      (c.phone && c.phone.includes(crmSearch));
    const matchCat = crmCategoryFilter === "ALL" || c.category === crmCategoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-xl animate-in fade-in slide-in-from-top-2 duration-200 ${
            actionMessage.type === "success"
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/15 border-rose-500/30 text-rose-300"
          }`}
        >
          <span className="flex items-center gap-2">
            {actionMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400" />
            )}
            {actionMessage.text}
          </span>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-lg shadow-orange-500/10">
            <Users className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              Administrator Akun &amp; CRM Pelanggan
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Kelola hak akses pengguna tim dapur/kasir, lisensi paket SaaS MarginOS, serta direktori CRM klien katering &amp; B2B.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "users" ? (
            <Button
              onClick={() => setIsAddUserOpen(true)}
              className="rounded-full bg-white hover:bg-slate-200 text-slate-950 text-xs font-black shadow-lg shadow-white/10 px-4 py-2 transition-all"
            >
              <UserPlus className="w-4 h-4 mr-1.5" /> Tambah Anggota Akun
            </Button>
          ) : activeTab === "crm" ? (
            <Button
              onClick={() => setIsAddCrmOpen(true)}
              className="rounded-full bg-white hover:bg-slate-200 text-slate-950 text-xs font-black shadow-lg shadow-white/10 px-4 py-2 transition-all"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Tambah Klien CRM
            </Button>
          ) : null}
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Users */}
        <div className="bg-[#181920]/80 backdrop-blur-2xl rounded-3xl border border-white/[0.08] p-4 flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Pengguna Terdaftar
            </span>
            <div className="text-2xl font-black text-white mt-1">
              {userStats.totalUsers || users.length} <span className="text-xs font-semibold text-slate-400">Akun</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-medium">
              {userStats.activeUsers || 0} Aktif • {userStats.managers || 0} Manajer
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-amber-400">
            <UserCheck className="w-5 h-5 text-amber-400" />
          </div>
        </div>

        {/* Card 2: Subscription Plan */}
        <div className="bg-[#181920]/80 backdrop-blur-2xl rounded-3xl border border-white/[0.08] p-4 flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Paket Lisensi Bisnis
            </span>
            <div className="text-lg font-black text-white mt-1 flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-amber-400" />
              {business?.subscriptionPlan || "FREE_TRIAL"}
            </div>
            <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">
              ● {business?.subscriptionStatus || "ACTIVE"}
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        {/* Card 3: CRM Contacts */}
        <div className="bg-[#181920]/80 backdrop-blur-2xl rounded-3xl border border-white/[0.08] p-4 flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Klien CRM &amp; B2B
            </span>
            <div className="text-2xl font-black text-white mt-1">
              {crmStats.totalCustomers || customers.length} <span className="text-xs font-semibold text-slate-400">Kontak</span>
            </div>
            <span className="text-[11px] text-amber-400 font-medium">
              {crmStats.vipCount || 0} Korporat &amp; VIP
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-orange-400">
            <Building2 className="w-5 h-5 text-orange-400" />
          </div>
        </div>

        {/* Card 4: CRM Revenue */}
        <div className="bg-[#181920]/80 backdrop-blur-2xl rounded-3xl border border-white/[0.08] p-4 flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Nilai Order CRM Katering
            </span>
            <div className="text-lg font-black text-emerald-400 mt-1">
              {formatIDR(crmStats.totalRevenue || 0)}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Dari {crmStats.totalOrders || 0} total pesanan
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-emerald-400">
            <CreditCard className="w-5 h-5 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[#181920]/90 border border-white/[0.08] p-1 rounded-full w-fit">
          <TabsTrigger
            value="users"
            className="rounded-full data-[state=active]:bg-white data-[state=active]:text-slate-950 text-slate-400 font-semibold text-xs px-4 py-1.5 transition-all flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            Manajemen Akun &amp; Tim ({users.length})
          </TabsTrigger>
          <TabsTrigger
            value="crm"
            className="rounded-full data-[state=active]:bg-white data-[state=active]:text-slate-950 text-slate-400 font-semibold text-xs px-4 py-1.5 transition-all flex items-center gap-1.5"
          >
            <Briefcase className="w-3.5 h-3.5 text-amber-400" />
            Direktori CRM Klien &amp; Katering ({customers.length})
          </TabsTrigger>
          <TabsTrigger
            value="plan"
            className="rounded-full data-[state=active]:bg-white data-[state=active]:text-slate-950 text-slate-400 font-semibold text-xs px-4 py-1.5 transition-all flex items-center gap-1.5"
          >
            <Crown className="w-3.5 h-3.5 text-orange-400" />
            Lisensi SaaS &amp; Paket ({business?.subscriptionPlan || "FREE"})
          </TabsTrigger>
          <TabsTrigger
            value="billing"
            className="rounded-full data-[state=active]:bg-white data-[state=active]:text-slate-950 text-slate-400 font-semibold text-xs px-4 py-1.5 transition-all flex items-center gap-1.5"
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
            Tagihan &amp; Pembayaran Lisensi
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* TAB 1: USERS MANAGEMENT */}
      {activeTab === "users" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-[#181920]/80 backdrop-blur-2xl rounded-2xl border border-white/[0.08] p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Cari nama, email, no HP..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-9 text-xs bg-white/[0.04] border-white/[0.08] text-white rounded-xl focus:border-amber-500/50"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Label className="text-xs text-slate-400 shrink-0 font-medium">Filter Hak Akses:</Label>
              <Select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="text-xs bg-white/[0.04] border-white/[0.08] text-white rounded-xl"
              >
                <option value="ALL" className="bg-[#181920] text-white">Semua Role</option>
                <option value="OWNER" className="bg-[#181920] text-white">Owner</option>
                <option value="MANAGER" className="bg-[#181920] text-white">Manager</option>
                <option value="STAFF" className="bg-[#181920] text-white">Staff (Cook / Barista / Kasir)</option>
              </Select>
            </div>
          </div>

          {/* Users Table */}
          {loading ? (
            <div className="p-16 text-center text-slate-400">
              <div className="inline-block w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
              <div className="text-xs font-medium">Memuat data pengguna...</div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <Card className="p-10 text-center text-slate-400 bg-[#181920]/80 border-white/[0.08] rounded-3xl text-xs">
              Tidak ada akun yang sesuai dengan pencarian.
            </Card>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-white/[0.08] bg-[#181920]/80 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
              <table className="w-full text-xs divide-y divide-white/[0.08]">
                <thead className="bg-white/[0.03] text-slate-400 font-semibold">
                  <tr>
                    <th className="p-3.5 text-left w-12">No</th>
                    <th className="p-3.5 text-left">Nama &amp; Akun</th>
                    <th className="p-3.5 text-left">Kontak</th>
                    <th className="p-3.5 text-left">Hak Akses (Role)</th>
                    <th className="p-3.5 text-left">Status</th>
                    <th className="p-3.5 text-left">Terdaftar</th>
                    <th className="p-3.5 text-right pr-4">Aksi Akun</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredUsers.map((u, idx) => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3.5 text-slate-500 font-bold">{idx + 1}</td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 font-black text-xs shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs flex items-center gap-1.5">
                              {u.name}
                              {u.role === "OWNER" && (
                                <span title="Pemilik Utama">
                                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-500" />
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-300">
                        {u.phone ? (
                          <span className="flex items-center gap-1 text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {u.phone}
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        {u.role === "OWNER" ? (
                          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] font-bold rounded-full">
                            OWNER
                          </Badge>
                        ) : (
                          <Select
                            value={u.role}
                            onChange={(e) => handleChangeRole(u, e.target.value)}
                            className="text-[11px] bg-white/[0.05] border-white/[0.1] text-white rounded-lg py-1 px-2 h-7"
                          >
                            <option value="MANAGER" className="bg-[#181920]">MANAGER</option>
                            <option value="STAFF" className="bg-[#181920]">STAFF</option>
                          </Select>
                        )}
                      </td>
                      <td className="p-3.5">
                        <Badge
                          className={`text-[10px] font-bold rounded-full ${
                            u.status === "ACTIVE"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                              : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                          }`}
                        >
                          {u.status === "ACTIVE" ? "AKTIF" : "SUSPEND"}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-[11px] text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="p-3.5 text-right pr-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {u.role !== "OWNER" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleUserStatus(u)}
                                className={`text-[11px] font-bold rounded-full h-7 px-3 ${
                                  u.status === "ACTIVE"
                                    ? "bg-rose-500/10 text-rose-300 border-rose-500/20 hover:bg-rose-500/20"
                                    : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20"
                                }`}
                              >
                                {u.status === "ACTIVE" ? "Suspend" : "Aktifkan"}
                              </Button>
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl cursor-pointer transition-colors"
                                title="Hapus Akun"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CRM & CLIENTS DIRECTORY */}
      {activeTab === "crm" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-[#181920]/80 backdrop-blur-2xl rounded-2xl border border-white/[0.08] p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Cari klien, perusahaan, no HP..."
                value={crmSearch}
                onChange={(e) => setCrmSearch(e.target.value)}
                className="pl-9 text-xs bg-white/[0.04] border-white/[0.08] text-white rounded-xl focus:border-amber-500/50"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Label className="text-xs text-slate-400 shrink-0 font-medium">Kategori Klien:</Label>
              <Select
                value={crmCategoryFilter}
                onChange={(e) => setCrmCategoryFilter(e.target.value)}
                className="text-xs bg-white/[0.04] border-white/[0.08] text-white rounded-xl"
              >
                <option value="ALL" className="bg-[#181920] text-white">Semua Kategori</option>
                <option value="CORPORATE" className="bg-[#181920] text-white">Corporate / Kantor</option>
                <option value="CATERING_B2B" className="bg-[#181920] text-white">Katering &amp; WO</option>
                <option value="VIP" className="bg-[#181920] text-white">Pelanggan VIP</option>
                <option value="EVENT" className="bg-[#181920] text-white">Komunitas / Event</option>
              </Select>
            </div>
          </div>

          {/* CRM Grid Cards */}
          {loading ? (
            <div className="p-16 text-center text-slate-400">
              <div className="inline-block w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
              <div className="text-xs font-medium">Memuat data CRM klien...</div>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <Card className="p-10 text-center text-slate-400 bg-[#181920]/80 border-white/[0.08] rounded-3xl text-xs">
              Belum ada data klien CRM yang tersimpan.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomers.map((cust) => (
                <div
                  key={cust.id}
                  className="bg-[#181920]/80 backdrop-blur-2xl rounded-3xl border border-white/[0.08] p-5 shadow-[0_15px_40px_rgba(0,0,0,0.5)] flex flex-col justify-between hover:border-white/[0.15] transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30 text-[10px] font-bold rounded-full mb-1">
                          {cust.category}
                        </Badge>
                        <h3 className="font-bold text-sm text-white line-clamp-1">{cust.name}</h3>
                        {cust.company && (
                          <span className="text-[11px] text-slate-400 block line-clamp-1">
                            {cust.company}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteCrm(cust)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl cursor-pointer transition-colors"
                        title="Hapus Klien"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-1 text-xs text-slate-300 bg-white/[0.03] p-3 rounded-2xl border border-white/[0.06]">
                      {cust.phone && (
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{cust.phone}</span>
                        </div>
                      )}
                      {cust.email && (
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{cust.email}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-1 border-t border-white/[0.05] text-[11px]">
                        <span className="text-slate-400">Total Transaksi:</span>
                        <span className="font-bold text-emerald-400">{formatIDR(cust.totalSpent)}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Total Order:</span>
                        <span className="font-bold text-white">{cust.totalOrders} Pesanan</span>
                      </div>
                    </div>

                    {cust.notes && (
                      <p className="text-[11px] text-slate-400 bg-amber-500/[0.06] border border-amber-500/15 p-2.5 rounded-xl line-clamp-2">
                        {cust.notes}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-slate-500 mt-2">
                    <span>Status: <strong className="text-emerald-400">{cust.status}</strong></span>
                    <span>Diperbarui baru saja</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SAAS SUBSCRIPTION PLAN SIMULATOR */}
      {activeTab === "plan" && (
        <div className="space-y-6">
          <div className="bg-[#181920]/80 backdrop-blur-2xl rounded-3xl border border-white/[0.08] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.6)] space-y-5">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                Paket Langganan SaaS MarginOS
              </span>
              <h2 className="text-xl font-black text-white mt-1">
                Pilih atau Beralih Paket Lisensi Komersial
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Aplikasi siap dijual dan dilisensikan secara multi-tenant. Setiap tingkatan paket membuka kapasitas outlet dan akun tim tambahan.
              </p>
            </div>

            {/* 3 Tier Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Plan 1: Free Trial */}
              <div
                className={`p-5 rounded-3xl border backdrop-blur-xl transition-all ${
                  business?.subscriptionPlan === "FREE_TRIAL"
                    ? "bg-amber-500/[0.08] border-amber-500/40 ring-1 ring-amber-500/40 shadow-xl"
                    : "bg-white/[0.02] border-white/[0.08]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-amber-400">Uji Coba Gratis</span>
                  {business?.subscriptionPlan === "FREE_TRIAL" && (
                    <Badge className="bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-full">
                      Paket Aktif
                    </Badge>
                  )}
                </div>
                <div className="text-2xl font-black text-white mt-2">
                  Rp 0 <span className="text-xs font-normal text-slate-400">/ 14 Hari</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300 mt-4 border-t border-white/[0.06] pt-4">
                  <li className="flex items-center gap-2">✓ 1 Outlet F&amp;B</li>
                  <li className="flex items-center gap-2">✓ Maksimal 3 Pengguna Akun</li>
                  <li className="flex items-center gap-2">✓ Kalkulator HPP &amp; Simulator OFD</li>
                </ul>
                <Button
                  disabled={business?.subscriptionPlan === "FREE_TRIAL" || businessSaving}
                  onClick={() => handleUpdatePlan("FREE_TRIAL")}
                  className="w-full mt-5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs font-bold h-9"
                >
                  Pilih Free Trial
                </Button>
              </div>

              {/* Plan 2: Starter */}
              <div
                className={`p-5 rounded-3xl border backdrop-blur-xl transition-all relative ${
                  business?.subscriptionPlan === "STARTER"
                    ? "bg-emerald-500/[0.08] border-emerald-500/40 ring-1 ring-emerald-500/40 shadow-xl"
                    : "bg-white/[0.02] border-white/[0.08]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-emerald-400">Starter F&amp;B</span>
                  {business?.subscriptionPlan === "STARTER" && (
                    <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-full">
                      Paket Aktif
                    </Badge>
                  )}
                </div>
                <div className="text-2xl font-black text-white mt-2">
                  Rp 149.000 <span className="text-xs font-normal text-slate-400">/ Bulan</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300 mt-4 border-t border-white/[0.06] pt-4">
                  <li className="flex items-center gap-2">✓ Hingga 2 Outlet Aktif</li>
                  <li className="flex items-center gap-2">✓ Hingga 7 Pengguna Tim</li>
                  <li className="flex items-center gap-2">✓ Cetak SOP Dapur &amp; Audit Stok COGS</li>
                  <li className="flex items-center gap-2">✓ Matriks Menu Engineering BEP</li>
                </ul>
                <Button
                  disabled={business?.subscriptionPlan === "STARTER" || businessSaving}
                  onClick={() => handleUpdatePlan("STARTER")}
                  className="w-full mt-5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black h-9 shadow-md shadow-emerald-500/20"
                >
                  Aktifkan Starter
                </Button>
              </div>

              {/* Plan 3: Pro */}
              <div
                className={`p-5 rounded-3xl border backdrop-blur-xl transition-all ${
                  business?.subscriptionPlan === "PRO"
                    ? "bg-orange-500/[0.08] border-orange-500/40 ring-1 ring-orange-500/40 shadow-xl"
                    : "bg-white/[0.02] border-white/[0.08]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-orange-400">Pro &amp; Multi-Outlet</span>
                  {business?.subscriptionPlan === "PRO" && (
                    <Badge className="bg-orange-500/20 text-orange-300 text-[10px] font-bold rounded-full">
                      Paket Aktif
                    </Badge>
                  )}
                </div>
                <div className="text-2xl font-black text-white mt-2">
                  Rp 299.000 <span className="text-xs font-normal text-slate-400">/ Bulan</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300 mt-4 border-t border-white/[0.06] pt-4">
                  <li className="flex items-center gap-2">✓ Unlimited Outlet &amp; Cloud Kitchen</li>
                  <li className="flex items-center gap-2">✓ Unlimited Pengguna (Staff/Manager)</li>
                  <li className="flex items-center gap-2">✓ Modul CRM B2B Katering Lengkap</li>
                  <li className="flex items-center gap-2">✓ Ekspor Laporan Finansial CSV</li>
                </ul>
                <Button
                  disabled={business?.subscriptionPlan === "PRO" || businessSaving}
                  onClick={() => handleUpdatePlan("PRO")}
                  className="w-full mt-5 rounded-full bg-white hover:bg-slate-200 text-slate-950 text-xs font-black h-9 shadow-lg shadow-white/10"
                >
                  Beralih ke Pro
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TAGIHAN & PEMBAYARAN SAAS TERINTEGRASI */}
      {activeTab === "billing" && (
        <div className="space-y-6">
          
          {/* Header Card Status Langganan */}
          <div className="p-5 sm:p-6 rounded-xl bg-[#19191b] border border-white/[0.08] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
              <div>
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block">
                  Tagihan &amp; Pembayaran Lisensi
                </span>
                <h2 className="text-base sm:text-lg font-bold text-[#ededed] mt-1">
                  Sistem Pembayaran Terintegrasi (Payment Gateway)
                </h2>
                <p className="text-xs text-[#85858b] mt-0.5">
                  Pembayaran otomatis via QRIS (GoPay/OVO/Dana/BCA) dan Virtual Account Bank lokal dengan aktivasi instan.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={() => handleOpenCheckout(business?.subscriptionPlan === "PRO" ? "PRO" : "STARTER")}
                  className="bg-amber-400 hover:bg-amber-300 text-[#141415] font-bold text-xs px-4 py-2 flex items-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Bayar &amp; Perpanjang Lisensi</span>
                </Button>
              </div>
            </div>

            {/* Status Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-lg bg-[#232325] border border-white/[0.06] space-y-1">
                <span className="text-[#85858b] block">Paket Langganan Aktif:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#ededed]">{business?.subscriptionPlan || "FREE_TRIAL"}</span>
                  <Badge variant={business?.subscriptionStatus === "ACTIVE" ? "healthy" : "warning"}>
                    {business?.subscriptionStatus || "ACTIVE"}
                  </Badge>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-[#232325] border border-white/[0.06] space-y-1">
                <span className="text-[#85858b] block">Biaya Langganan:</span>
                <span className="font-bold text-sm font-mono text-emerald-400">
                  {business?.subscriptionPlan === "PRO"
                    ? "Rp 299.000 / bln"
                    : business?.subscriptionPlan === "STARTER"
                    ? "Rp 149.000 / bln"
                    : "Rp 0 (Trial)"}
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-[#232325] border border-white/[0.06] space-y-1">
                <span className="text-[#85858b] block">Jatuh Tempo Perpanjangan:</span>
                <span className="font-bold text-sm text-amber-400">
                  {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Plan Comparison & Quick Upgrade Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Plan 1: Starter F&B */}
            <div className="p-5 rounded-xl bg-[#19191b] border border-white/[0.08] flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Starter F&amp;B</span>
                  {business?.subscriptionPlan === "STARTER" && (
                    <Badge variant="healthy">Paket Aktif</Badge>
                  )}
                </div>
                <div className="text-2xl font-bold font-mono text-[#ededed]">
                  Rp 149.000 <span className="text-xs font-normal text-[#85858b]">/ Bulan</span>
                </div>
                <p className="text-xs text-[#85858b]">
                  Pilihan utama kafe, resto mandiri, dan cloud kitchen untuk mengamankan margin HPP.
                </p>
                <ul className="space-y-2 text-xs text-[#a1a1a6] pt-3 border-t border-white/[0.06]">
                  <li className="flex items-center gap-2">✓ Hingga 2 Cabang Outlet</li>
                  <li className="flex items-center gap-2">✓ Hingga 7 Pengguna Tim (Staf/Manager)</li>
                  <li className="flex items-center gap-2">✓ Cetak SOP Dapur &amp; Ekspor CSV</li>
                  <li className="flex items-center gap-2">✓ Audit Stok Opname COGS &amp; P&amp;L</li>
                </ul>
              </div>

              <Button
                onClick={() => handleOpenCheckout("STARTER")}
                className="w-full bg-[#232325] hover:bg-[#2b2b2f] text-[#ededed] border border-white/[0.1] font-semibold text-xs py-2 mt-2"
              >
                Pilih &amp; Bayar Starter (QRIS / VA)
              </Button>
            </div>

            {/* Plan 2: Pro Multi-Outlet */}
            <div className="p-5 rounded-xl bg-[#19191b] border border-amber-500/30 ring-1 ring-amber-500/20 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Pro Multi-Outlet</span>
                  {business?.subscriptionPlan === "PRO" && (
                    <Badge variant="healthy">Paket Aktif</Badge>
                  )}
                </div>
                <div className="text-2xl font-bold font-mono text-[#ededed]">
                  Rp 299.000 <span className="text-xs font-normal text-[#85858b]">/ Bulan</span>
                </div>
                <p className="text-xs text-[#85858b]">
                  Solusi manajemen menu terpusat untuk jaringan kuliner bertumbuh dengan banyak cabang.
                </p>
                <ul className="space-y-2 text-xs text-[#a1a1a6] pt-3 border-t border-white/[0.06]">
                  <li className="flex items-center gap-2">✓ Unlimited Cabang Outlet</li>
                  <li className="flex items-center gap-2">✓ Unlimited Pengguna (Staf/Manager)</li>
                  <li className="flex items-center gap-2">✓ Modul CRM B2B Katering &amp; Pelanggan VIP</li>
                  <li className="flex items-center gap-2">✓ Prioritas Support &amp; Integrasi Lanjutan</li>
                </ul>
              </div>

              <Button
                onClick={() => handleOpenCheckout("PRO")}
                className="w-full bg-amber-400 hover:bg-amber-300 text-[#141415] font-bold text-xs py-2 mt-2"
              >
                Pilih &amp; Bayar Pro (QRIS / VA)
              </Button>
            </div>

          </div>

          {/* Riwayat Tagihan & Invoice Resmi */}
          <div className="p-5 sm:p-6 rounded-xl bg-[#19191b] border border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#ededed]">
                  Riwayat Invoice &amp; Transaksi Pembayaran
                </h3>
                <p className="text-xs text-[#85858b]">
                  Daftar seluruh tagihan resmi langganan MarginOS untuk usaha Anda
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchAllData}
                className="flex items-center gap-1.5 text-xs text-[#85858b]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Segarkan</span>
              </Button>
            </div>

            {invoices.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#85858b] space-y-2">
                <Receipt className="w-8 h-8 text-[#85858b] mx-auto opacity-50" />
                <p>Belum ada riwayat transaksi pembayaran.</p>
                <p className="text-[11px]">Klik tombol &quot;Bayar &amp; Perpanjang Lisensi&quot; di atas untuk membuat tagihan pertama Anda.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-[#85858b] text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-3">No. Invoice</th>
                      <th className="py-2.5 px-3">Tanggal</th>
                      <th className="py-2.5 px-3">Paket &amp; Durasi</th>
                      <th className="py-2.5 px-3">Metode</th>
                      <th className="py-2.5 px-3 text-right">Total Tagihan</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Aksi</th>
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
                          <td className="py-3 px-3 text-[#a1a1a6]">
                            {new Date(inv.createdAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-3 px-3 text-[#ededed]">
                            {inv.plan} • {inv.billingCycle === "ANNUALLY" ? "Tahunan (12 Bln)" : "Bulanan"}
                          </td>
                          <td className="py-3 px-3 text-[#a1a1a6] font-mono">
                            {inv.paymentMethod}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-[#ededed]">
                            {formatIDR(inv.amount)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <Badge variant={isPaid ? "healthy" : "warning"}>
                              {isPaid ? "LUNAS" : "MENUNGGU PEMBAYARAN"}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-right">
                            {!isPaid ? (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setActiveInvoice(inv);
                                  setIsCheckoutModalOpen(true);
                                }}
                                className="bg-amber-400 hover:bg-amber-300 text-[#141415] font-bold text-[11px] h-7 px-2.5"
                              >
                                Bayar Sekarang →
                              </Button>
                            ) : (
                              <span className="text-[#85858b] text-[11px]">
                                {inv.paidAt ? new Date(inv.paidAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "Lunas"}
                              </span>
                            )}
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
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: CHECKOUT & PAYMENT GATEWAY TERMINAL TERINTEGRASI
          ───────────────────────────────────────────────────────────── */}
      <Dialog
        open={isCheckoutModalOpen}
        onClose={() => {
          setIsCheckoutModalOpen(false);
          setActiveInvoice(null);
        }}
        maxWidth="lg"
        title="Pembayaran Lisensi MarginOS"
        description="Sistem Payment Gateway Terintegrasi (QRIS Instan & Virtual Account)"
      >
        {!activeInvoice ? (
          /* Step 1: Form Pemilihan Paket & Metode Pembayaran */
          <div className="space-y-5 text-xs text-[#ededed]">
            
            {/* Pilihan Paket */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#ededed]">1. Pilih Paket Langganan</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCheckoutPlan("STARTER")}
                  className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                    checkoutPlan === "STARTER"
                      ? "bg-[#232325] border-amber-400 ring-1 ring-amber-400/30"
                      : "bg-[#19191b] border-white/[0.08] hover:bg-[#232325]"
                  }`}
                >
                  <div className="font-bold text-[#ededed]">Starter F&amp;B</div>
                  <div className="font-mono text-amber-400 font-bold mt-1">Rp 149.000 / bln</div>
                  <div className="text-[11px] text-[#85858b] mt-1">2 Outlet • 7 Pengguna Tim</div>
                </button>

                <button
                  type="button"
                  onClick={() => setCheckoutPlan("PRO")}
                  className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                    checkoutPlan === "PRO"
                      ? "bg-[#232325] border-amber-400 ring-1 ring-amber-400/30"
                      : "bg-[#19191b] border-white/[0.08] hover:bg-[#232325]"
                  }`}
                >
                  <div className="font-bold text-[#ededed]">Pro Multi-Outlet</div>
                  <div className="font-mono text-amber-400 font-bold mt-1">Rp 299.000 / bln</div>
                  <div className="text-[11px] text-[#85858b] mt-1">Unlimited Outlet &amp; CRM B2B</div>
                </button>
              </div>
            </div>

            {/* Pilihan Periode Penagihan */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#ededed]">2. Periode Pembayaran</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCheckoutCycle("MONTHLY")}
                  className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                    checkoutCycle === "MONTHLY"
                      ? "bg-[#232325] border-white/20 text-[#ededed]"
                      : "bg-[#19191b] border-white/[0.08] text-[#85858b] hover:text-[#ededed]"
                  }`}
                >
                  <div className="font-medium">Bulanan (1 Bulan)</div>
                  <div className="text-[11px] text-[#85858b]">Tagihan rutin per bulan</div>
                </button>

                <button
                  type="button"
                  onClick={() => setCheckoutCycle("ANNUALLY")}
                  className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                    checkoutCycle === "ANNUALLY"
                      ? "bg-[#232325] border-emerald-500/50 text-[#ededed]"
                      : "bg-[#19191b] border-white/[0.08] text-[#85858b] hover:text-[#ededed]"
                  }`}
                >
                  <div className="font-medium text-emerald-400">Tahunan (Hemat 2 Bulan)</div>
                  <div className="text-[11px] text-[#85858b]">Bayar 10 bulan untuk 12 bulan</div>
                </button>
              </div>
            </div>

            {/* Pilihan Metode Pembayaran */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#ededed]">3. Pilih Metode Pembayaran</Label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setCheckoutMethod("QRIS")}
                  className={`p-3 rounded-lg border text-left transition-colors flex items-center justify-between cursor-pointer ${
                    checkoutMethod === "QRIS"
                      ? "bg-[#232325] border-amber-400"
                      : "bg-[#19191b] border-white/[0.08] hover:bg-[#232325]"
                  }`}
                >
                  <div>
                    <div className="font-bold text-[#ededed]">QRIS Instan</div>
                    <div className="text-[10px] text-[#85858b]">GoPay, OVO, Dana, BCA, Shopee</div>
                  </div>
                  <QrCode className="w-5 h-5 text-amber-400" />
                </button>

                <button
                  type="button"
                  onClick={() => setCheckoutMethod("VA_BCA")}
                  className={`p-3 rounded-lg border text-left transition-colors flex items-center justify-between cursor-pointer ${
                    checkoutMethod === "VA_BCA"
                      ? "bg-[#232325] border-amber-400"
                      : "bg-[#19191b] border-white/[0.08] hover:bg-[#232325]"
                  }`}
                >
                  <div>
                    <div className="font-bold text-[#ededed]">BCA Virtual Account</div>
                    <div className="text-[10px] text-[#85858b]">Transfer otomatis m-BCA/ATM</div>
                  </div>
                  <CreditCard className="w-5 h-5 text-sky-400" />
                </button>

                <button
                  type="button"
                  onClick={() => setCheckoutMethod("VA_MANDIRI")}
                  className={`p-3 rounded-lg border text-left transition-colors flex items-center justify-between cursor-pointer ${
                    checkoutMethod === "VA_MANDIRI"
                      ? "bg-[#232325] border-amber-400"
                      : "bg-[#19191b] border-white/[0.08] hover:bg-[#232325]"
                  }`}
                >
                  <div>
                    <div className="font-bold text-[#ededed]">Mandiri Virtual Account</div>
                    <div className="text-[10px] text-[#85858b]">Livin by Mandiri &amp; ATM</div>
                  </div>
                  <CreditCard className="w-5 h-5 text-amber-400" />
                </button>

                <button
                  type="button"
                  onClick={() => setCheckoutMethod("VA_BRI")}
                  className={`p-3 rounded-lg border text-left transition-colors flex items-center justify-between cursor-pointer ${
                    checkoutMethod === "VA_BRI"
                      ? "bg-[#232325] border-amber-400"
                      : "bg-[#19191b] border-white/[0.08] hover:bg-[#232325]"
                  }`}
                >
                  <div>
                    <div className="font-bold text-[#ededed]">BRI Virtual Account</div>
                    <div className="text-[10px] text-[#85858b]">BRImo &amp; ATM BRI</div>
                  </div>
                  <CreditCard className="w-5 h-5 text-blue-400" />
                </button>
              </div>
            </div>

            {/* Total Pembayaran & Tombol Lanjut */}
            <div className="p-3.5 rounded-lg bg-[#232325] border border-white/[0.08] flex items-center justify-between">
              <div>
                <span className="text-[11px] text-[#85858b] block">Total Pembayaran:</span>
                <span className="font-mono font-bold text-base text-amber-400">
                  {formatIDR(
                    checkoutCycle === "ANNUALLY"
                      ? (checkoutPlan === "PRO" ? 299000 : 149000) * 10
                      : checkoutPlan === "PRO" ? 299000 : 149000
                  )}
                </span>
              </div>

              <Button
                disabled={isGeneratingInvoice}
                onClick={handleGenerateInvoice}
                className="bg-amber-400 hover:bg-amber-300 text-[#141415] font-bold text-xs px-5 py-2 flex items-center gap-2"
              >
                <span>{isGeneratingInvoice ? "Memproses..." : "Lanjutkan Pembayaran →"}</span>
              </Button>
            </div>

          </div>
        ) : activeInvoice.paymentStatus === "PAID" ? (
          /* Step 3: Tampilan Pembayaran Berhasil */
          <div className="py-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
              <Check className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#ededed]">Pembayaran Berhasil Dikonfirmasi!</h3>
              <p className="text-xs text-[#85858b]">
                Invoice <strong className="font-mono text-[#ededed]">{activeInvoice.invoiceNumber}</strong> telah lunas.
              </p>
            </div>

            <div className="max-w-xs mx-auto p-3.5 rounded-lg bg-[#232325] border border-white/[0.08] text-xs text-left space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#85858b]">Paket Aktif:</span>
                <strong className="text-[#ededed]">{activeInvoice.plan}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#85858b]">Nominal:</span>
                <strong className="font-mono text-emerald-400">{formatIDR(activeInvoice.amount)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#85858b]">Waktu Bayar:</span>
                <strong className="text-[#ededed]">
                  {activeInvoice.paidAt ? new Date(activeInvoice.paidAt).toLocaleTimeString("id-ID") : "Baru saja"}
                </strong>
              </div>
            </div>

            <Button
              onClick={() => {
                setIsCheckoutModalOpen(false);
                setActiveInvoice(null);
                fetchAllData();
              }}
              className="bg-[#ededed] text-[#141415] hover:bg-white font-bold text-xs px-6 py-2"
            >
              Selesai &amp; Kembali ke Aplikasi
            </Button>
          </div>
        ) : (
          /* Step 2: Payment Terminal (QRIS / VA) */
          <div className="space-y-4 text-xs">
            
            {/* Header Tagihan */}
            <div className="p-3 rounded-lg bg-[#232325] border border-white/[0.08] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-[#85858b] block">{activeInvoice.invoiceNumber}</span>
                <span className="font-bold text-[#ededed] text-xs">
                  Paket {activeInvoice.plan} ({activeInvoice.billingCycle === "ANNUALLY" ? "Tahunan" : "Bulanan"})
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#85858b] block">Total Tagihan:</span>
                <span className="font-mono font-bold text-sm text-amber-400">{formatIDR(activeInvoice.amount)}</span>
              </div>
            </div>

            {/* Detail Tampilan Berdasarkan Metode */}
            {activeInvoice.paymentMethod === "QRIS" ? (
              <div className="p-5 rounded-xl bg-white text-[#141415] text-center space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-black/[0.1] text-xs">
                  <div className="font-bold flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-red-600" />
                    <span>QRIS STANDAR NASIONAL</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">NMID: ID102938472910</span>
                </div>

                {/* Simulated High-Res QRIS Visual SVG */}
                <div className="w-48 h-48 mx-auto bg-white p-2 border-2 border-black rounded-lg shadow-inner flex flex-col items-center justify-center relative">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-black">
                    <rect width="100" height="100" fill="white" />
                    {/* Top Left Marker */}
                    <rect x="10" y="10" width="25" height="25" fill="black" />
                    <rect x="14" y="14" width="17" height="17" fill="white" />
                    <rect x="17" y="17" width="11" height="11" fill="black" />
                    {/* Top Right Marker */}
                    <rect x="65" y="10" width="25" height="25" fill="black" />
                    <rect x="69" y="14" width="17" height="17" fill="white" />
                    <rect x="72" y="17" width="11" height="11" fill="black" />
                    {/* Bottom Left Marker */}
                    <rect x="10" y="65" width="25" height="25" fill="black" />
                    <rect x="14" y="69" width="17" height="17" fill="white" />
                    <rect x="17" y="72" width="11" height="11" fill="black" />
                    {/* Data Pattern */}
                    <rect x="40" y="12" width="5" height="15" fill="black" />
                    <rect x="50" y="18" width="8" height="5" fill="black" />
                    <rect x="42" y="32" width="18" height="6" fill="black" />
                    <rect x="15" y="42" width="12" height="5" fill="black" />
                    <rect x="32" y="45" width="6" height="18" fill="black" />
                    <rect x="45" y="45" width="12" height="12" fill="black" />
                    <rect x="62" y="42" width="8" height="18" fill="black" />
                    <rect x="75" y="42" width="15" height="6" fill="black" />
                    <rect x="42" y="65" width="8" height="12" fill="black" />
                    <rect x="55" y="62" width="12" height="6" fill="black" />
                    <rect x="72" y="68" width="18" height="18" fill="black" />
                    <rect x="78" y="74" width="6" height="6" fill="white" />
                    {/* Center Logo Pill */}
                    <rect x="40" y="40" width="20" height="20" rx="4" fill="white" stroke="black" strokeWidth="1.5" />
                    <text x="50" y="53" textAnchor="middle" fontSize="9" fontWeight="bold" fill="black">MOS</text>
                  </svg>
                </div>

                <div className="space-y-1">
                  <div className="font-bold text-xs text-slate-900">Merchant: MARGINOS TEKNOLOGI INDONESIA</div>
                  <div className="text-[11px] text-slate-600">
                    Buka BCA Mobile, GoPay, OVO, ShopeePay, atau DANA lalu scan kode QR di atas.
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-mono text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                  <span>Menunggu pembayaran otomatis...</span>
                </div>
              </div>
            ) : (
              /* Virtual Account View */
              <div className="p-4 rounded-xl bg-[#232325] border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                  <span className="font-bold text-[#ededed]">
                    {activeInvoice.paymentMethod === "VA_BCA"
                      ? "Bank Central Asia (BCA)"
                      : activeInvoice.paymentMethod === "VA_MANDIRI"
                      ? "Bank Mandiri"
                      : "Bank Rakyat Indonesia (BRI)"}
                  </span>
                  <Badge variant="secondary">Virtual Account</Badge>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-[#85858b]">Nomor Virtual Account:</span>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#19191b] border border-white/[0.08]">
                    <span className="font-mono font-bold text-base text-amber-400">
                      {activeInvoice.vaNumber || "883019283318291"}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(activeInvoice.vaNumber || "883019283318291", "vaNumber")}
                      className="text-xs h-7 px-2 flex items-center gap-1"
                    >
                      {copiedField === "vaNumber" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === "vaNumber" ? "Tersalin" : "Salin VA"}</span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-[#85858b]">Atas Nama Rekening:</span>
                  <div className="font-medium text-[#ededed]">MarginOS / {activeInvoice.businessName}</div>
                </div>

                <p className="text-[11px] text-[#85858b] pt-1">
                  Pilih menu Transfer Virtual Account di m-Banking atau ATM, lalu masukkan nomor VA di atas. Transaksi Anda akan otomatis terverifikasi seketika.
                </p>
              </div>
            )}

            {/* Sandbox Simulation / Developer Testing Box */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Mode Simulasi Payment Gateway (Real-Time Sandbox)</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Anda dapat menguji proses pembayaran otomatis tanpa mentransfer uang riil. Begitu tombol di bawah ditekan, webhook pembayaran sukses akan dipicu seketika dan masa aktif lisensi langsung diperpanjang di database.
              </p>
              <Button
                disabled={isSimulating}
                onClick={() => handleSimulatePayment(activeInvoice.id)}
                className="w-full bg-amber-400 hover:bg-amber-300 text-[#141415] font-bold text-xs py-2 flex items-center justify-center gap-2 shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSimulating ? "Mengonfirmasi..." : "Simulasikan Pembayaran Sukses Sekarang"}</span>
              </Button>
            </div>

          </div>
        )}
      </Dialog>

      {/* Modal: Tambah User Baru */}
      <Dialog
        open={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        maxWidth="md"
        title="Tambah Anggota Akun Baru"
        description="Berikan akses MarginOS kepada staf koki, barista, atau manajer outlet."
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-300">Nama Lengkap *</Label>
            <Input
              required
              value={newUserForm.name}
              onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
              placeholder="Misal: Dimas Barista, Siti Manager"
              className="text-xs bg-[#16171d] border-white/[0.1] text-white rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Email Login *</Label>
              <Input
                required
                type="email"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                placeholder="nama@email.com"
                className="text-xs bg-[#16171d] border-white/[0.1] text-white rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Password Awal *</Label>
              <Input
                required
                type="password"
                value={newUserForm.password}
                onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                placeholder="Minimal 6 karakter"
                className="text-xs bg-[#16171d] border-white/[0.1] text-white rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Peran / Hak Akses *</Label>
              <Select
                value={newUserForm.role}
                onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                className="text-xs bg-[#16171d] border-white/[0.1] text-white rounded-xl"
              >
                <option value="STAFF" className="bg-[#16171d]">STAFF (Koki / Barista / Kasir)</option>
                <option value="MANAGER" className="bg-[#16171d]">MANAGER (Akses Resep &amp; Audit Stok)</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">No. WhatsApp / HP</Label>
              <Input
                value={newUserForm.phone}
                onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                placeholder="0812-xxxx-xxxx"
                className="text-xs bg-[#16171d] border-white/[0.1] text-white rounded-xl"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddUserOpen(false)}
              className="rounded-full border-white/[0.1] text-slate-300 text-xs px-4"
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="rounded-full bg-white hover:bg-slate-200 text-slate-950 font-black text-xs px-5 shadow-lg shadow-white/10"
            >
              Simpan Akun
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal: Tambah Klien CRM */}
      <Dialog
        open={isAddCrmOpen}
        onClose={() => setIsAddCrmOpen(false)}
        maxWidth="md"
        title="Catat Klien CRM Baru"
        description="Simpan kontak pelanggan korporat, mitra katering, atau pelanggan langganan VIP."
      >
        <form onSubmit={handleCreateCrm} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-300">Nama Kontak / Klien *</Label>
            <Input
              required
              value={newCrmForm.name}
              onChange={(e) => setNewCrmForm({ ...newCrmForm, name: e.target.value })}
              placeholder="Misal: Ibu Maya (WO), PT Nusantara Mediatech"
              className="text-xs bg-[#16171d] border-white/[0.1] text-white rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Nama Perusahaan / Organisasi</Label>
              <Input
                value={newCrmForm.company}
                onChange={(e) => setNewCrmForm({ ...newCrmForm, company: e.target.value })}
                placeholder="Misal: Wedding Organizer 'Kencana'"
                className="text-xs bg-[#16171d] border-white/[0.1] text-white rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Kategori Klien</Label>
              <Select
                value={newCrmForm.category}
                onChange={(e) => setNewCrmForm({ ...newCrmForm, category: e.target.value as any })}
                className="text-xs bg-[#16171d] border-white/[0.1] text-white rounded-xl"
              >
                <option value="CORPORATE" className="bg-[#16171d]">Corporate / Kantor</option>
                <option value="CATERING_B2B" className="bg-[#16171d]">Katering &amp; Wedding</option>
                <option value="VIP" className="bg-[#16171d]">Pelanggan VIP</option>
                <option value="EVENT" className="bg-[#16171d]">Event / Komunitas</option>
                <option value="REGULAR" className="bg-[#16171d]">Reguler</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">No. WhatsApp / HP</Label>
              <Input
                value={newCrmForm.phone}
                onChange={(e) => setNewCrmForm({ ...newCrmForm, phone: e.target.value })}
                placeholder="0812-xxxx-xxxx"
                className="text-xs bg-[#16171d] border-white/[0.1] text-white rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Email</Label>
              <Input
                type="email"
                value={newCrmForm.email}
                onChange={(e) => setNewCrmForm({ ...newCrmForm, email: e.target.value })}
                placeholder="klien@kantor.com"
                className="text-xs bg-[#16171d] border-white/[0.1] text-white rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-300">Catatan Khusus Klien / Kebutuhan Menu</Label>
            <Input
              value={newCrmForm.notes}
              onChange={(e) => setNewCrmForm({ ...newCrmForm, notes: e.target.value })}
              placeholder="Misal: Pesan coffee break tiap Senin pagi, 50 snack box per event..."
              className="text-xs bg-[#16171d] border-white/[0.1] text-white rounded-xl"
            />
          </div>

          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddCrmOpen(false)}
              className="rounded-full border-white/[0.1] text-slate-300 text-xs px-4"
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="rounded-full bg-white hover:bg-slate-200 text-slate-950 font-black text-xs px-5 shadow-lg shadow-white/10"
            >
              Simpan Klien CRM
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
