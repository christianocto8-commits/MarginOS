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

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        outlets: true,
        users: {
          select: { id: true, name: true, email: true, role: true, status: true },
        },
      },
    });

    if (!business) {
      return NextResponse.json({ error: "Bisnis tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({
      business,
      outletsCount: business.outlets.length,
      usersCount: business.users.length,
    });
  } catch (err: any) {
    console.error("GET /api/admin/business error:", err);
    return NextResponse.json({ error: "Gagal memuat data bisnis" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    const businessId = session?.business?.id || session?.user?.businessId;

    if (!businessId) {
      return NextResponse.json({ error: "Sesi tidak valid atau belum login" }, { status: 401 });
    }

    if (session?.user?.role !== "OWNER" && session?.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Hanya Owner yang dapat mengubah data profil bisnis" }, { status: 403 });
    }

    const body = await req.json();
    const { name, ownerName, phone, subscriptionPlan, subscriptionStatus } = body;

    // Only SUPER_ADMIN can change subscriptionPlan and subscriptionStatus directly via API
    const canChangePlan = session?.user?.role === "SUPER_ADMIN";

    const updated = await prisma.business.update({
      where: { id: businessId },
      data: {
        name: name !== undefined ? name : undefined,
        ownerName: ownerName !== undefined ? ownerName : undefined,
        phone: phone !== undefined ? phone : undefined,
        subscriptionPlan: canChangePlan && subscriptionPlan !== undefined ? subscriptionPlan : undefined,
        subscriptionStatus: canChangePlan && subscriptionStatus !== undefined ? subscriptionStatus : undefined,
      },
    });

    return NextResponse.json({ success: true, business: updated });
  } catch (err: any) {
    console.error("PUT /api/admin/business error:", err);
    return NextResponse.json({ error: "Gagal memperbarui info bisnis" }, { status: 500 });
  }
}
