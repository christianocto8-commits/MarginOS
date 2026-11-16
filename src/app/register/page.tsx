"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, Store, User as UserIcon, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    businessName: "",
    businessCategory: "Coffee Shop",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mendaftarkan akun");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan koneksi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#141415] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-[#ededed]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link href="/landing" className="inline-flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#232325] text-amber-400 border border-white/[0.1] flex items-center justify-center font-mono font-bold text-sm">
            M
          </div>
          <span className="font-bold text-xl tracking-tight text-[#ededed]">
            Margin<span className="font-normal text-[#a1a1a6]">OS</span>
          </span>
        </Link>
        <h1 className="text-lg font-bold text-[#ededed] tracking-tight">
          Daftar Akun Baru (Uji Coba 14 Hari)
        </h1>
        <p className="text-xs text-[#85858b]">
          Mulai kalkulasi HPP resep dan amankan margin laba bisnis F&amp;B Anda.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="border border-white/[0.08] bg-[#19191b] shadow-xl">
          <CardContent className="p-6 sm:p-7">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-[#ededed]">Nama Pemilik</Label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-[#85858b] absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    required
                    placeholder="Budi Santoso"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-[#ededed]">Nama Usaha / Brand F&amp;B</Label>
                <div className="relative">
                  <Store className="w-4 h-4 text-[#85858b] absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    required
                    placeholder="Kenangan Senja Coffee"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-[#ededed]">Kategori Usaha</Label>
                <Select
                  value={formData.businessCategory}
                  onChange={(e) => setFormData({ ...formData, businessCategory: e.target.value })}
                >
                  <option value="Coffee Shop">Coffee Shop &amp; Cafe</option>
                  <option value="Restaurant">Restoran / Rumah Makan</option>
                  <option value="Bakery">Bakery &amp; Pastry</option>
                  <option value="Cloud Kitchen">Cloud Kitchen / Ghost Kitchen</option>
                  <option value="Catering">Katering &amp; Nasi Kotak</option>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-[#ededed]">Alamat Email</Label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#85858b] absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="email"
                    required
                    placeholder="nama@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-[#ededed]">Kata Sandi</Label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#85858b] absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Minimal 6 karakter"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-[#ededed]">Nomor WhatsApp (Opsional)</Label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#85858b] absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="tel"
                    placeholder="0812xxxxxxxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="pl-9"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#ededed] text-[#141415] hover:bg-white font-bold text-xs py-2.5 mt-2"
              >
                {loading ? "Mendaftarkan..." : "Buat Akun & Coba 14 Hari"}
              </Button>
            </form>

            <div className="mt-5 pt-4 border-t border-white/[0.06] text-center text-xs text-[#85858b]">
              Sudah punya akun?{" "}
              <Link href="/login" className="font-semibold text-amber-400 hover:text-amber-300">
                Masuk di sini
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
