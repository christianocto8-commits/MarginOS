import { NextResponse } from "next/server";
import crypto from "crypto";
import { markInvoiceAsPaid } from "@/lib/billing-service";

function verifyWebhookAuthenticity(rawBody: string, req: Request): boolean {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;

  // Header signatures
  const hmacSignature = req.headers.get("x-callback-signature") || req.headers.get("x-signature");
  const callbackToken = req.headers.get("x-callback-token");

  // If secret is configured, enforce verification
  if (secret) {
    // 1. Direct Callback Token match (e.g. Xendit Webhook Verification Token)
    if (callbackToken && callbackToken === secret) {
      return true;
    }

    // 2. HMAC-SHA256 signature match
    if (hmacSignature) {
      try {
        const expectedSignature = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
        if (crypto.timingSafeEqual(Buffer.from(hmacSignature), Buffer.from(expectedSignature))) {
          return true;
        }
      } catch {
        return false;
      }
    }

    // 3. Midtrans SHA512 signature verification (if payload contains signature_key)
    try {
      const parsed = JSON.parse(rawBody);
      if (parsed.signature_key && parsed.order_id && parsed.status_code && parsed.gross_amount) {
        const payloadString = `${parsed.order_id}${parsed.status_code}${parsed.gross_amount}${secret}`;
        const calculatedSha512 = crypto.createHash("sha512").update(payloadString).digest("hex");
        if (calculatedSha512 === parsed.signature_key) {
          return true;
        }
      }
    } catch {
      // JSON parse failure handled below
    }

    // If secret is set but none of the verification methods succeeded:
    return false;
  }

  // If secret is not set, reject in production
  if (process.env.NODE_ENV === "production") {
    console.error("FATAL: PAYMENT_WEBHOOK_SECRET must be configured in production.");
    return false;
  }

  // Allow in development only with warning
  console.warn("WARNING: Processing webhook without signature verification in development environment.");
  return true;
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();

    if (!verifyWebhookAuthenticity(rawBody, req)) {
      return NextResponse.json(
        { error: "Invalid webhook signature or unauthorized source" },
        { status: 401 }
      );
    }

    const body = JSON.parse(rawBody);

    // Supports Midtrans Notification or Xendit Invoice format
    const orderId = body.order_id || body.external_id || body.invoiceNumber;
    const status = body.transaction_status || body.status;

    if (!orderId) {
      return NextResponse.json({ error: "Missing order_id or external_id" }, { status: 400 });
    }

    const isPaid =
      status === "settlement" ||
      status === "capture" ||
      status === "PAID" ||
      status === "COMPLETED";

    if (isPaid) {
      const result = await markInvoiceAsPaid(orderId, body.transaction_id || "WEBHOOK_VERIFIED");
      return NextResponse.json({
        received: true,
        updated: result.success,
        message: result.message,
      });
    }

    return NextResponse.json({ received: true, status });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: "Webhook handling failed" }, { status: 500 });
  }
}
