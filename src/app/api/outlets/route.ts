import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    const businessId = session?.business?.id || session?.user?.businessId;

    if (!businessId && session?.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Sesi tidak valid atau belum login" }, { status: 401 });
    }

    const whereClause = businessId ? { businessId } : {};

    const outlets = await prisma.outlet.findMany({
      where: whereClause,
      orderBy: { createdAt: "asc" },
      include: {
        _count: {
          select: {
            ingredients: true,
            subRecipes: true,
            menus: true,
            purchases: true,
          },
        },
      },
    });

    return NextResponse.json(outlets);
  } catch (error) {
    console.error("Failed to fetch outlets:", error);
    return NextResponse.json(
      { error: "Gagal memuat daftar outlet" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const businessId = session?.business?.id || session?.user?.businessId;

    if (!businessId && session?.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Sesi tidak valid atau belum login" }, { status: 401 });
    }

    if (session?.user?.role !== "OWNER" && session?.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Hanya Owner yang dapat membuat outlet baru" }, { status: 403 });
    }

    const body = await req.json();
    const { name, code, category, address, phone, targetFoodCostPercent, monthlyFixedCost } = body;

    if (!name || !code) {
      return NextResponse.json(
        { error: "Nama cabang dan kode outlet wajib diisi" },
        { status: 400 }
      );
    }

    const outlet = await prisma.outlet.create({
      data: {
        businessId: businessId || null,
        name,
        code: code.toUpperCase().trim(),
        category: category || "Coffee Shop",
        address: address || null,
        phone: phone || null,
        targetFoodCostPercent: parseFloat(targetFoodCostPercent) || 30.0,
        monthlyFixedCost: parseFloat(monthlyFixedCost) || 15000000.0,
      },
    });

    return NextResponse.json(outlet, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create outlet:", error);
    return NextResponse.json(
      { error: error.message || "Gagal membuat outlet cabang" },
      { status: 400 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    const businessId = session?.business?.id || session?.user?.businessId;

    if (!businessId && session?.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Sesi tidak valid atau belum login" }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, code, category, address, phone, targetFoodCostPercent, monthlyFixedCost } = body;

    if (!id) {
      return NextResponse.json({ error: "ID outlet diperlukan" }, { status: 400 });
    }

    const existing = await prisma.outlet.findUnique({ where: { id } });
    if (!existing || (session?.user?.role !== "SUPER_ADMIN" && existing.businessId !== businessId)) {
      return NextResponse.json({ error: "Outlet tidak ditemukan" }, { status: 404 });
    }

    const updated = await prisma.outlet.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        code: code !== undefined ? code.toUpperCase().trim() : undefined,
        category: category !== undefined ? category : undefined,
        address: address !== undefined ? address : undefined,
        phone: phone !== undefined ? phone : undefined,
        targetFoodCostPercent: targetFoodCostPercent !== undefined ? parseFloat(targetFoodCostPercent) : undefined,
        monthlyFixedCost: monthlyFixedCost !== undefined ? parseFloat(monthlyFixedCost) : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Failed to update outlet:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memperbarui outlet" },
      { status: 400 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    const businessId = session?.business?.id || session?.user?.businessId;

    if (!businessId && session?.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Sesi tidak valid atau belum login" }, { status: 401 });
    }

    if (session?.user?.role !== "OWNER" && session?.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Hanya Owner yang dapat menghapus outlet" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID outlet diperlukan" }, { status: 400 });
    }

    const existing = await prisma.outlet.findUnique({ where: { id } });
    if (!existing || (session?.user?.role !== "SUPER_ADMIN" && existing.businessId !== businessId)) {
      return NextResponse.json({ error: "Outlet tidak ditemukan" }, { status: 404 });
    }

    await prisma.outlet.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Outlet berhasil dihapus" });
  } catch (error: any) {
    console.error("Failed to delete outlet:", error);
    return NextResponse.json(
      { error: error.message || "Gagal menghapus outlet" },
      { status: 400 }
    );
  }
}
