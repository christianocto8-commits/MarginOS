import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    const businessId = session?.business?.id || session?.user?.businessId;

    if (!businessId && session?.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Sesi tidak valid atau belum login" }, { status: 401 });
    }

    const where = businessId ? { businessId } : {};

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const stats = {
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.status === "ACTIVE").length,
      managers: users.filter((u) => u.role === "MANAGER" || u.role === "OWNER").length,
      staff: users.filter((u) => u.role === "STAFF").length,
    };

    return NextResponse.json({ users, stats });
  } catch (err: any) {
    console.error("GET /api/admin/users error:", err);
    return NextResponse.json({ error: "Gagal memuat daftar pengguna" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const businessId = session?.business?.id || session?.user?.businessId;

    if (!businessId) {
      return NextResponse.json({ error: "Sesi tidak valid atau belum login" }, { status: 401 });
    }

    // Role check: Only OWNER, MANAGER, or SUPER_ADMIN can create accounts
    if (session.user.role !== "OWNER" && session.user.role !== "SUPER_ADMIN" && session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Hanya Owner/Manager yang dapat menambahkan pengguna" }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, password, role = "STAFF", phone } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nama, email, dan password wajib diisi" },
        { status: 400 }
      );
    }

    // Managers cannot create OWNER or SUPER_ADMIN accounts
    if (session.user.role === "MANAGER" && (role.toUpperCase() === "OWNER" || role.toUpperCase() === "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Manager tidak memiliki wewenang membuat akun Owner" }, { status: 403 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email sudah terdaftar dalam sistem" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        businessId,
        name,
        email,
        passwordHash,
        role: role.toUpperCase(),
        phone: phone || null,
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (err: any) {
    console.error("POST /api/admin/users error:", err);
    return NextResponse.json({ error: "Gagal membuat pengguna baru" }, { status: 500 });
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
    const { id, name, role, status, phone } = body;

    if (!id) {
      return NextResponse.json({ error: "ID pengguna diperlukan" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser || (session?.user?.role !== "SUPER_ADMIN" && targetUser.businessId !== businessId)) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    // Privilege Escalation Prevention: Only OWNER or SUPER_ADMIN can modify user roles
    if (role !== undefined && session?.user?.role !== "OWNER" && session?.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Hanya Owner atau Super Admin yang dapat mengubah wewenang role" },
        { status: 403 }
      );
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        role: role !== undefined ? role.toUpperCase() : undefined,
        status: status !== undefined ? status.toUpperCase() : undefined,
        phone: phone !== undefined ? phone : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (err: any) {
    console.error("PUT /api/admin/users error:", err);
    return NextResponse.json({ error: "Gagal memperbarui pengguna" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    const businessId = session?.business?.id || session?.user?.businessId;

    if (!businessId && session?.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Sesi tidak valid atau belum login" }, { status: 401 });
    }

    // Only OWNER or SUPER_ADMIN can delete users
    if (session?.user?.role !== "OWNER" && session?.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Hanya Owner yang dapat menghapus pengguna" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID pengguna diperlukan" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || (session?.user?.role !== "SUPER_ADMIN" && user.businessId !== businessId)) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    if (user.role === "OWNER") {
      return NextResponse.json(
        { error: "Akun dengan role OWNER utama tidak dapat dihapus" },
        { status: 400 }
      );
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Pengguna berhasil dihapus" });
  } catch (err: any) {
    console.error("DELETE /api/admin/users error:", err);
    return NextResponse.json({ error: "Gagal menghapus pengguna" }, { status: 500 });
  }
}
