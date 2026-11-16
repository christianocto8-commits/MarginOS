import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface TenantContext {
  error: NextResponse | null;
  session: any;
  businessId: string | null;
  allowedOutletIds: string[];
  isSuperAdmin: boolean;
}

/**
 * Resolves the authenticated tenant context and authorized outlet IDs for the current request.
 * Returns an HTTP 401 response in error if the session is absent or unauthorized.
 */
export async function getTenantContext(): Promise<TenantContext> {
  const session = await getSession();
  if (!session) {
    return {
      error: NextResponse.json({ error: "Sesi tidak valid atau belum login" }, { status: 401 }),
      session: null,
      businessId: null,
      allowedOutletIds: [],
      isSuperAdmin: false,
    };
  }

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";
  const businessId = session.business?.id || session.user?.businessId || null;

  if (!businessId && !isSuperAdmin) {
    return {
      error: NextResponse.json({ error: "ID bisnis tidak ditemukan pada sesi" }, { status: 401 }),
      session,
      businessId: null,
      allowedOutletIds: [],
      isSuperAdmin: false,
    };
  }

  // Super Admin can access all outlets across all businesses
  if (isSuperAdmin && !businessId) {
    const allOutlets = await prisma.outlet.findMany({ select: { id: true } });
    return {
      error: null,
      session,
      businessId: null,
      allowedOutletIds: allOutlets.map((o) => o.id),
      isSuperAdmin: true,
    };
  }

  // Find authorized outlets belonging to this tenant
  const tenantOutlets = await prisma.outlet.findMany({
    where: { businessId: businessId! },
    select: { id: true },
  });

  return {
    error: null,
    session,
    businessId,
    allowedOutletIds: tenantOutlets.map((o) => o.id),
    isSuperAdmin,
  };
}
