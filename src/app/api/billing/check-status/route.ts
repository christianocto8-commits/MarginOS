import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getInvoiceById } from "@/lib/billing-service";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const invoiceId = searchParams.get("invoiceId");

    if (!invoiceId) {
      return NextResponse.json({ error: "Parameter invoiceId diperlukan" }, { status: 400 });
    }

    const invoice = getInvoiceById(invoiceId);
    if (!invoice) {
      return NextResponse.json({ error: "Invoice tidak ditemukan" }, { status: 404 });
    }

    // IDOR Prevention: invoice must belong to the requesting business unless caller is SUPER_ADMIN
    const userBusinessId = session.user?.businessId || session.business?.id;
    if (session.user.role !== "SUPER_ADMIN" && invoice.businessId !== userBusinessId) {
      return NextResponse.json({ error: "Invoice tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      paymentStatus: invoice.paymentStatus,
      paidAt: invoice.paidAt,
      plan: invoice.plan,
    });
  } catch (err: any) {
    console.error("Check invoice status error:", err);
    return NextResponse.json({ error: "Gagal memeriksa status invoice" }, { status: 500 });
  }
}
