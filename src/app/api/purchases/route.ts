import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-auth";

export async function GET(req: Request) {
  try {
    const { error, allowedOutletIds, isSuperAdmin } = await getTenantContext();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const outletId = searchParams.get("outletId");

    if (outletId && !allowedOutletIds.includes(outletId) && !isSuperAdmin) {
      return NextResponse.json({ error: "Akses ke outlet ini ditolak" }, { status: 403 });
    }

    const targetOutletIds = outletId ? [outletId] : allowedOutletIds;
    const whereClause: any = { outletId: { in: targetOutletIds } };

    const purchases = await prisma.purchaseLog.findMany({
      where: whereClause,
      orderBy: { purchaseDate: "desc" },
    });

    const parsedPurchases = purchases.map((p) => {
      let items = [];
      try {
        items = JSON.parse(p.itemsJson || "[]");
      } catch (e) {
        items = [];
      }
      return {
        ...p,
        items,
      };
    });

    // Stats
    const totalAmount = parsedPurchases.reduce((acc, p) => acc + p.totalAmount, 0);
    const totalTransactions = parsedPurchases.length;
    const avgTransaction = totalTransactions > 0 ? Math.round(totalAmount / totalTransactions) : 0;

    // Supplier frequency
    const supplierCounts: Record<string, number> = {};
    parsedPurchases.forEach((p) => {
      if (p.supplierName) {
        supplierCounts[p.supplierName] = (supplierCounts[p.supplierName] || 0) + 1;
      }
    });
    const topSupplier = Object.keys(supplierCounts).sort((a, b) => supplierCounts[b] - supplierCounts[a])[0] || "-";

    const stats = {
      totalAmount,
      totalTransactions,
      avgTransaction,
      topSupplier,
    };

    return NextResponse.json({ purchases: parsedPurchases, stats });
  } catch (err: any) {
    console.error("GET /api/purchases error:", err);
    return NextResponse.json({ error: "Gagal memuat riwayat belanja bahan" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { error, allowedOutletIds, isSuperAdmin } = await getTenantContext();
    if (error) return error;

    const body = await req.json();
    const {
      outletId,
      invoiceNumber,
      supplierName,
      purchaseDate,
      paymentMethod = "TRANSFER",
      paymentStatus = "PAID",
      notes,
      items = [],
    } = body;

    if (!outletId || (!allowedOutletIds.includes(outletId) && !isSuperAdmin)) {
      return NextResponse.json({ error: "Outlet tidak valid atau tidak memiliki akses" }, { status: 403 });
    }

    if (!supplierName || items.length === 0) {
      return NextResponse.json(
        { error: "Supplier dan minimal 1 item bahan belanja wajib diisi" },
        { status: 400 }
      );
    }

    const invNum = invoiceNumber || `INV-PO-${Date.now().toString().slice(-6)}`;
    const totalAmount = items.reduce((acc: number, it: any) => acc + (parseFloat(it.subtotal) || 0), 0);

    const purchase = await prisma.$transaction(async (tx) => {
      // 1. Create Purchase Log
      const pLog = await tx.purchaseLog.create({
        data: {
          outletId,
          invoiceNumber: invNum,
          supplierName: supplierName.trim(),
          purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
          totalAmount,
          paymentMethod,
          paymentStatus,
          notes: notes || null,
          itemsJson: JSON.stringify(items),
        },
      });

      // 2. Update stock & price for each ingredient
      for (const it of items) {
        if (it.ingredientId) {
          const ing = await tx.ingredient.findUnique({ where: { id: it.ingredientId } });
          if (ing && (allowedOutletIds.includes(ing.outletId) || isSuperAdmin)) {
            const addedStock = parseFloat(it.quantity) || 0;
            const newStock = Math.max(0, ing.currentStock + addedStock);
            const newPrice = parseFloat(it.pricePerUnit) || ing.purchasePrice;

            // Check if price changed
            const priceChanged = Math.abs(newPrice - ing.purchasePrice) > 1;
            const changePercent = ing.purchasePrice > 0 ? ((newPrice - ing.purchasePrice) / ing.purchasePrice) * 100 : 0;

            await tx.ingredient.update({
              where: { id: it.ingredientId },
              data: {
                currentStock: newStock,
                purchasePrice: newPrice,
                supplier: supplierName.trim(),
              },
            });

            if (priceChanged) {
              await tx.ingredientPriceHistory.create({
                data: {
                  ingredientId: it.ingredientId,
                  price: newPrice,
                  packageSize: ing.packageSize,
                  purchaseUnit: ing.purchaseUnit,
                  changePercent,
                  notes: `Update otomatis dari nota belanja ${invNum} (${supplierName})`,
                },
              });
            }
          }
        }
      }

      return pLog;
    });

    return NextResponse.json({ success: true, purchase }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/purchases error:", err);
    return NextResponse.json({ error: "Gagal mencatat transaksi belanja bahan" }, { status: 500 });
  }
}
