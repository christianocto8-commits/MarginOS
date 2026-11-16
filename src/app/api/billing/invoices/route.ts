import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getBusinessInvoices, getAllInvoices } from "@/lib/billing-service";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all") === "true";

    // Only SUPER_ADMIN can view all businesses' invoices
    if (all && session.user.role === "SUPER_ADMIN") {
      const allInvoices = getAllInvoices();
      return NextResponse.json({ invoices: allInvoices });
    }

    const invoices = getBusinessInvoices(session.business.id);
    return NextResponse.json({ invoices });
  } catch (err: any) {
    console.error("Fetch invoices error:", err);
    return NextResponse.json({ error: "Gagal memuat invoice" }, { status: 500 });
  }
}
