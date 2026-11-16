import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, getSession } from "@/lib/auth";

async function requireSuperAdmin() {
  const session = await getSession();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return null;
  }
  return session;
}

export async function GET() {
  try {
    const session = await requireSuperAdmin();
    if (!session) {
      return NextResponse.json({ error: "Akses ditolak: Wewenang Super Admin diperlukan" }, { status: 403 });
    }

    const businesses = await prisma.business.findMany({
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            phone: true,
            status: true,
            createdAt: true,
          },
        },
        outlets: {
          select: {
            id: true,
            name: true,
            category: true,
            currency: true,
          },
        },
        _count: {
          select: {
            users: true,
            outlets: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Plan pricing constants in IDR/month
    const planPricing: Record<string, number> = {
      FREE_TRIAL: 0,
      STARTER: 149000,
      PRO: 299000,
      ENTERPRISE: 599000,
    };

    let totalMRR = 0;
    let activeSubscribers = 0;
    let trialCount = 0;
    let expiredCount = 0;

    const tenants = businesses.map((b) => {
      const owner = b.users.find((u) => u.role === "OWNER") || b.users[0] || null;
      const isPaid = b.subscriptionPlan !== "FREE_TRIAL" && b.subscriptionStatus === "ACTIVE";
      const monthlyFee = planPricing[b.subscriptionPlan] || 0;

      if (isPaid) {
        totalMRR += monthlyFee;
        activeSubscribers += 1;
      }
      if (b.subscriptionPlan === "FREE_TRIAL") {
        trialCount += 1;
      }
      if (b.subscriptionStatus === "EXPIRED" || b.subscriptionStatus === "SUSPENDED") {
        expiredCount += 1;
      }

      // Calculate days remaining
      let daysRemaining = 0;
      if (b.trialEndsAt) {
        const diffTime = new Date(b.trialEndsAt).getTime() - new Date().getTime();
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      return {
        id: b.id,
        name: b.name,
        slug: b.slug,
        ownerName: b.ownerName || owner?.name || "-",
        ownerEmail: owner?.email || "-",
        phone: b.phone || owner?.phone || "-",
        subscriptionPlan: b.subscriptionPlan,
        subscriptionStatus: b.subscriptionStatus,
        trialEndsAt: b.trialEndsAt,
        daysRemaining,
        monthlyFee,
        totalUsers: b._count.users,
        totalOutlets: b._count.outlets,
        outlets: b.outlets,
        createdAt: b.createdAt,
      };
    });

    const stats = {
      totalTenants: businesses.length,
      activeSubscribers,
      trialCount,
      expiredCount,
      totalMRR,
    };

    return NextResponse.json({ tenants, stats });
  } catch (err: any) {
    console.error("GET /api/super-admin/tenants error:", err);
    return NextResponse.json({ error: "Gagal memuat data klien SaaS" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSuperAdmin();
    if (!session) {
      return NextResponse.json({ error: "Akses ditolak: Wewenang Super Admin diperlukan" }, { status: 403 });
    }

    const body = await req.json();
    const {
      businessName,
      category = "Coffee Shop",
      ownerName,
      email,
      password,
      phone,
      subscriptionPlan = "STARTER",
      durationMonths = 1,
    } = body;

    if (!businessName || !ownerName || !email || !password) {
      return NextResponse.json(
        { error: "Nama usaha, nama owner, email, dan password wajib diisi." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email sudah terdaftar untuk klien lain." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const slug =
      businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") +
      "-" +
      Math.floor(1000 + Math.random() * 9000);

    // Calculate expiration date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(durationMonths, 10) * 30);

    const result = await prisma.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: {
          name: businessName.trim(),
          slug,
          ownerName: ownerName.trim(),
          phone: phone || null,
          subscriptionPlan: subscriptionPlan.toUpperCase(),
          subscriptionStatus: "ACTIVE",
          trialEndsAt: expiryDate,
        },
      });

      const user = await tx.user.create({
        data: {
          businessId: business.id,
          name: ownerName.trim(),
          email: email.toLowerCase().trim(),
          passwordHash,
          role: "OWNER",
          phone: phone || null,
          status: "ACTIVE",
        },
      });

      const outlet = await tx.outlet.create({
        data: {
          businessId: business.id,
          name: `${businessName.trim()} - Pusat`,
          code: `${slug.slice(0, 6).toUpperCase()}-01`,
          category,
          currency: "IDR",
          targetFoodCostPercent: 30.0,
          monthlyFixedCost: 15000000.0,
        },
      });

      return { business, user, outlet };
    });

    return NextResponse.json({ success: true, tenant: result });
  } catch (err: any) {
    console.error("POST /api/super-admin/tenants error:", err);
    return NextResponse.json({ error: "Gagal mendaftarkan klien baru" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await requireSuperAdmin();
    if (!session) {
      return NextResponse.json({ error: "Akses ditolak: Wewenang Super Admin diperlukan" }, { status: 403 });
    }

    const body = await req.json();
    const { id, action, subscriptionPlan, subscriptionStatus, extendDays } = body;

    if (!id) {
      return NextResponse.json({ error: "ID bisnis diperlukan" }, { status: 400 });
    }

    const currentBiz = await prisma.business.findUnique({ where: { id } });
    if (!currentBiz) {
      return NextResponse.json({ error: "Bisnis klien tidak ditemukan" }, { status: 404 });
    }

    const updateData: any = {};

    if (action === "extend") {
      const days = parseInt(extendDays || 30, 10);
      const baseDate = currentBiz.trialEndsAt && new Date(currentBiz.trialEndsAt) > new Date()
        ? new Date(currentBiz.trialEndsAt)
        : new Date();
      baseDate.setDate(baseDate.getDate() + days);

      updateData.trialEndsAt = baseDate;
      updateData.subscriptionStatus = "ACTIVE";
    } else {
      if (subscriptionPlan !== undefined) {
        updateData.subscriptionPlan = subscriptionPlan;
      }
      if (subscriptionStatus !== undefined) {
        updateData.subscriptionStatus = subscriptionStatus;
      }
    }

    const updated = await prisma.business.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, business: updated });
  } catch (err: any) {
    console.error("PUT /api/super-admin/tenants error:", err);
    return NextResponse.json({ error: "Gagal memperbarui status klien" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await requireSuperAdmin();
    if (!session) {
      return NextResponse.json({ error: "Akses ditolak: Wewenang Super Admin diperlukan" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID bisnis diperlukan" }, { status: 400 });
    }

    await prisma.business.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Klien bisnis berhasil dihapus" });
  } catch (err: any) {
    console.error("DELETE /api/super-admin/tenants error:", err);
    return NextResponse.json({ error: "Gagal menghapus klien bisnis" }, { status: 500 });
  }
}
