import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  businessId: string;
  businessName: string;
  plan: "STARTER" | "PRO" | "ENTERPRISE";
  billingCycle: "MONTHLY" | "ANNUALLY";
  amount: number;
  paymentMethod: "QRIS" | "VA_BCA" | "VA_MANDIRI" | "VA_BRI";
  paymentStatus: "PENDING" | "PAID" | "EXPIRED" | "FAILED";
  vaNumber?: string;
  qrisData?: string;
  paidAt?: string;
  expiredAt: string;
  createdAt: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const INVOICES_FILE = path.join(DATA_DIR, "billing-invoices.json");

// Ensure data directory and file exist
function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(INVOICES_FILE)) {
    fs.writeFileSync(INVOICES_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

export function getAllInvoices(): InvoiceRecord[] {
  ensureStorage();
  try {
    const raw = fs.readFileSync(INVOICES_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to read invoices:", err);
    return [];
  }
}

export function saveInvoices(invoices: InvoiceRecord[]) {
  ensureStorage();
  fs.writeFileSync(INVOICES_FILE, JSON.stringify(invoices, null, 2), "utf-8");
}

export function getBusinessInvoices(businessId: string): InvoiceRecord[] {
  const all = getAllInvoices();
  return all
    .filter((inv) => inv.businessId === businessId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getInvoiceById(invoiceId: string): InvoiceRecord | undefined {
  const all = getAllInvoices();
  return all.find((inv) => inv.id === invoiceId || inv.invoiceNumber === invoiceId);
}

export async function createSubscriptionInvoice(params: {
  businessId: string;
  businessName: string;
  plan: "STARTER" | "PRO";
  billingCycle: "MONTHLY" | "ANNUALLY";
  paymentMethod: "QRIS" | "VA_BCA" | "VA_MANDIRI" | "VA_BRI";
}): Promise<InvoiceRecord> {
  const { businessId, businessName, plan, billingCycle, paymentMethod } = params;

  // Pricing math (IDR)
  const basePrice = plan === "PRO" ? 299000 : 149000;
  const amount = billingCycle === "ANNUALLY" ? basePrice * 10 : basePrice; // 2 months free for annual

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const invoiceNumber = `INV-MOS-${dateStr}-${randomSuffix}`;
  const id = `inv_${Date.now()}_${randomSuffix}`;

  // Expire in 24 hours (or 15 mins for QRIS)
  const expiredAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  // VA generator
  let vaNumber: string | undefined = undefined;
  if (paymentMethod === "VA_BCA") {
    vaNumber = `88301${Math.floor(100000000 + Math.random() * 900000000)}`;
  } else if (paymentMethod === "VA_MANDIRI") {
    vaNumber = `89201${Math.floor(100000000 + Math.random() * 900000000)}`;
  } else if (paymentMethod === "VA_BRI") {
    vaNumber = `12801${Math.floor(100000000 + Math.random() * 900000000)}`;
  }

  // QRIS payload string simulation (Standard Indonesian National QRIS)
  const qrisData = `00020101021226680016ID.CO.MARGINOS.WWW0118936009180000000000520458125303360540${amount}5802ID5916MARGINOS TECH ID6007JAKARTA62190115${invoiceNumber}6304`;

  const newInvoice: InvoiceRecord = {
    id,
    invoiceNumber,
    businessId,
    businessName,
    plan,
    billingCycle,
    amount,
    paymentMethod,
    paymentStatus: "PENDING",
    vaNumber,
    qrisData,
    expiredAt,
    createdAt: now.toISOString(),
  };

  const all = getAllInvoices();
  all.unshift(newInvoice);
  saveInvoices(all);

  return newInvoice;
}

export async function markInvoiceAsPaid(
  invoiceId: string,
  paymentRef?: string
): Promise<{ success: boolean; invoice?: InvoiceRecord; message: string }> {
  const all = getAllInvoices();
  const index = all.findIndex((inv) => inv.id === invoiceId || inv.invoiceNumber === invoiceId);

  if (index === -1) {
    return { success: false, message: "Invoice tidak ditemukan" };
  }

  const invoice = all[index];
  if (invoice.paymentStatus === "PAID") {
    return { success: true, invoice, message: "Invoice ini sudah lunas sebelumnya." };
  }

  const now = new Date();
  invoice.paymentStatus = "PAID";
  invoice.paidAt = now.toISOString();
  all[index] = invoice;
  saveInvoices(all);

  // Extend business subscription in database
  try {
    const business = await prisma.business.findUnique({
      where: { id: invoice.businessId },
    });

    if (business) {
      const daysToAdd = invoice.billingCycle === "ANNUALLY" ? 365 : 30;
      let currentExpiry = business.trialEndsAt ? new Date(business.trialEndsAt) : now;
      if (currentExpiry.getTime() < now.getTime()) {
        currentExpiry = now;
      }
      const newExpiry = new Date(currentExpiry.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

      await prisma.business.update({
        where: { id: business.id },
        data: {
          subscriptionPlan: invoice.plan,
          subscriptionStatus: "ACTIVE",
          trialEndsAt: newExpiry,
        },
      });
    }
  } catch (err) {
    console.error("Failed to update business subscription in DB:", err);
  }

  return {
    success: true,
    invoice,
    message: `Pembayaran ${invoice.invoiceNumber} berhasil dikonfirmasi. Paket ${invoice.plan} aktif!`,
  };
}
