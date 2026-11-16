import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { markInvoiceAsPaid } from "@/lib/billing-service";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
    }

    const { invoiceId } = await req.json();

    if (!invoiceId) {
      return NextResponse.json({ error: "Invoice ID diperlukan" }, { status: 400 });
    }

    const result = await markInvoiceAsPaid(invoiceId, "SIMULATOR_SANDBOX");

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      invoice: result.invoice,
    });
  } catch (err: any) {
    console.error("Simulate payment error:", err);
    return NextResponse.json({ error: "Gagal memproses simulasi pembayaran" }, { status: 500 });
  }
}
