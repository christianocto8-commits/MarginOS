import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { name, email, password, businessName, businessCategory, phone } = await req.json();

    if (!name || !email || !password || !businessName) {
      return NextResponse.json(
        { error: "Nama, email, password, dan nama usaha wajib diisi." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email sudah terdaftar. Silakan login." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const slug = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") + "-" + Math.floor(1000 + Math.random() * 9000);

    // 14 days trial from today
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    // Create Business, Owner User, and first Default Outlet in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: {
          name: businessName.trim(),
          slug,
          ownerName: name.trim(),
          phone: phone || null,
          subscriptionPlan: "FREE_TRIAL",
          subscriptionStatus: "ACTIVE",
          trialEndsAt,
        },
      });

      const user = await tx.user.create({
        data: {
          businessId: business.id,
          name: name.trim(),
          email: email.toLowerCase().trim(),
          passwordHash,
          role: "OWNER",
          phone: phone || null,
        },
      });

      // Default outlet for this business
      const outletCode = "OUT-" + Math.floor(100 + Math.random() * 900);
      const outlet = await tx.outlet.create({
        data: {
          businessId: business.id,
          name: `${businessName.trim()} (Pusat)`,
          code: outletCode,
          category: businessCategory || "Coffee Shop",
          targetFoodCostPercent: 30.0,
          monthlyFixedCost: 15000000.0,
        },
      });

      return { business, user, outlet };
    });

    const token = signToken({
      userId: result.user.id,
      businessId: result.business.id,
      role: result.user.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
      },
      business: result.business,
      outlet: result.outlet,
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Gagal mendaftarkan akun baru. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
