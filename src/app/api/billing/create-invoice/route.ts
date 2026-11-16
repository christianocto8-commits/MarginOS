import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createSubscriptionInvoice } from "@/lib/billing-service";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
    }

    const { plan, billingCycle = "MONTHLY", paymentMethod = "QRIS" } = await req.json();

    if (!["STARTER", "PRO"].includes(plan)) {
      return NextResponse.json({ error: "Paket langganan tidak valid" }, { status: 400 });
    }

    if (!["QRIS", "VA_BCA", "VA_MANDIRI", "VA_BRI"].includes(paymentMethod)) {
      return NextResponse.json({ error: "Metode pembayaran tidak didukung" }, { status: 400 });
    }

    const invoice = await createSubscriptionInvoice({
      businessId: session.business.id,
      businessName: session.business.name,
      plan,
      billingCycle,
      paymentMethod,
    });

    return NextResponse.json({
      success: true,
      invoice,
    });
  } catch (error: any) {
    console.error("Billing error:", error);
    return NextResponse.json(
      { error: "Gagal membuat invoice tagihan" },
      { status: 500 }
    );
  }
}
