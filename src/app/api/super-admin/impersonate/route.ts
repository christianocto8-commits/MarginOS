import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken, COOKIE_NAME, getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Akses ditolak: Hanya Super Admin yang diizinkan melakukan impersonasi" },
        { status: 403 }
      );
    }

    const { businessId } = await req.json();

    if (!businessId) {
      return NextResponse.json({ error: "ID bisnis diperlukan" }, { status: 400 });
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        users: true,
        outlets: true,
      },
    });

    if (!business) {
      return NextResponse.json({ error: "Bisnis tidak ditemukan" }, { status: 404 });
    }

    // Find the owner user of this business
    const ownerUser = business.users.find((u) => u.role === "OWNER") || business.users[0];

    if (!ownerUser) {
      return NextResponse.json({ error: "Tidak ditemukan akun owner untuk bisnis ini" }, { status: 404 });
    }

    // Sign token as this client
    const token = signToken({
      userId: ownerUser.id,
      businessId: business.id,
      role: ownerUser.role,
    });

    const response = NextResponse.json({
      success: true,
      clientName: business.name,
      ownerEmail: ownerUser.email,
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("POST /api/super-admin/impersonate error:", err);
    return NextResponse.json({ error: "Gagal beralih ke workspace klien" }, { status: 500 });
  }
}
