import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    const businessId = session?.business?.id || session?.user?.businessId;

    if (!businessId) {
      return NextResponse.json({ error: "Sesi tidak valid atau belum login" }, { status: 401 });
    }

    const customers = await prisma.crmCustomer.findMany({
      where: { businessId },
      orderBy: { totalSpent: "desc" },
    });

    const totalRevenue = customers.reduce((acc, c) => acc + c.totalSpent, 0);
    const totalOrders = customers.reduce((acc, c) => acc + c.totalOrders, 0);

    const stats = {
      totalCustomers: customers.length,
      activeCustomers: customers.filter((c) => c.status === "ACTIVE").length,
      vipCount: customers.filter((c) => c.category === "VIP" || c.category === "CORPORATE").length,
      totalRevenue,
      totalOrders,
    };

    return NextResponse.json({ customers, stats });
  } catch (err: any) {
    console.error("GET /api/admin/crm error:", err);
    return NextResponse.json({ error: "Gagal memuat data CRM pelanggan" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const businessId = session?.business?.id || session?.user?.businessId;

    if (!businessId) {
      return NextResponse.json({ error: "Sesi tidak valid atau belum login" }, { status: 401 });
    }

    const body = await req.json();
    const { name, company, email, phone, category = "REGULAR", notes, totalSpent = 0, totalOrders = 0 } = body;

    if (!name) {
      return NextResponse.json({ error: "Nama klien / pelanggan wajib diisi" }, { status: 400 });
    }

    const customer = await prisma.crmCustomer.create({
      data: {
        businessId,
        name,
        company: company || null,
        email: email || null,
        phone: phone || null,
        category,
        status: "ACTIVE",
        totalSpent: parseFloat(totalSpent) || 0,
        totalOrders: parseInt(totalOrders, 10) || 0,
        notes: notes || null,
        lastContact: new Date(),
      },
    });

    return NextResponse.json({ success: true, customer });
  } catch (err: any) {
    console.error("POST /api/admin/crm error:", err);
    return NextResponse.json({ error: "Gagal menambahkan kontak CRM" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    const businessId = session?.business?.id || session?.user?.businessId;

    if (!businessId) {
      return NextResponse.json({ error: "Sesi tidak valid atau belum login" }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, company, email, phone, category, status, notes, totalSpent, totalOrders } = body;

    if (!id) {
      return NextResponse.json({ error: "ID kontak CRM diperlukan" }, { status: 400 });
    }

    const existing = await prisma.crmCustomer.findUnique({ where: { id } });
    if (!existing || (session?.user?.role !== "SUPER_ADMIN" && existing.businessId !== businessId)) {
      return NextResponse.json({ error: "Kontak CRM tidak ditemukan" }, { status: 404 });
    }

    const customer = await prisma.crmCustomer.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        company: company !== undefined ? company : undefined,
        email: email !== undefined ? email : undefined,
        phone: phone !== undefined ? phone : undefined,
        category: category !== undefined ? category : undefined,
        status: status !== undefined ? status : undefined,
        notes: notes !== undefined ? notes : undefined,
        totalSpent: totalSpent !== undefined ? parseFloat(totalSpent) : undefined,
        totalOrders: totalOrders !== undefined ? parseInt(totalOrders, 10) : undefined,
        lastContact: new Date(),
      },
    });

    return NextResponse.json({ success: true, customer });
  } catch (err: any) {
    console.error("PUT /api/admin/crm error:", err);
    return NextResponse.json({ error: "Gagal memperbarui kontak CRM" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    const businessId = session?.business?.id || session?.user?.businessId;

    if (!businessId) {
      return NextResponse.json({ error: "Sesi tidak valid atau belum login" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID kontak CRM diperlukan" }, { status: 400 });
    }

    const existing = await prisma.crmCustomer.findUnique({ where: { id } });
    if (!existing || (session?.user?.role !== "SUPER_ADMIN" && existing.businessId !== businessId)) {
      return NextResponse.json({ error: "Kontak CRM tidak ditemukan" }, { status: 404 });
    }

    await prisma.crmCustomer.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Kontak CRM berhasil dihapus" });
  } catch (err: any) {
    console.error("DELETE /api/admin/crm error:", err);
    return NextResponse.json({ error: "Gagal menghapus kontak CRM" }, { status: 500 });
  }
}
