import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-auth";
import { calculateEffectiveUnitCost } from "@/lib/costing-engine";

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
    const where: any = { outletId: { in: targetOutletIds } };

    const ingredients = await prisma.ingredient.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        priceHistory: {
          orderBy: { effectiveDate: "desc" },
          take: 5,
        },
        outlet: {
          select: { name: true, category: true },
        },
      },
    });

    const enriched = ingredients.map((ing) => {
      // Base recipe unit: gr for weight, ml for volume, pcs for count
      const defaultRecipeUnit = ["kg", "gr", "g", "mg", "ons"].includes(ing.purchaseUnit.toLowerCase())
        ? "gr"
        : ["liter", "l", "ml", "oz", "cup"].includes(ing.purchaseUnit.toLowerCase())
        ? "ml"
        : "pcs";

      const { effectiveUnitCost, rawUnitCost, yieldMultiplier } = calculateEffectiveUnitCost(
        ing.purchasePrice,
        ing.packageSize,
        ing.purchaseUnit,
        defaultRecipeUnit,
        ing.yieldPercent
      );

      // Latest price change from history
      const _latestHistory = ing.priceHistory[0];
      const previousHistory = ing.priceHistory[1];
      const priceChangePercent = previousHistory
        ? ((ing.purchasePrice - previousHistory.price) / previousHistory.price) * 100
        : 0;

      return {
        ...ing,
        defaultRecipeUnit,
        rawUnitCost,
        effectiveUnitCost,
        yieldMultiplier,
        priceChangePercent,
        hasPriceIncrease: priceChangePercent > 0,
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Failed to fetch ingredients:", error);
    return NextResponse.json(
      { error: "Gagal memuat bahan baku" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { error, allowedOutletIds, isSuperAdmin } = await getTenantContext();
    if (error) return error;

    const body = await req.json();
    const {
      outletId,
      name,
      sku,
      category,
      supplier,
      purchasePrice,
      packageSize,
      purchaseUnit,
      yieldPercent,
      isPackaging,
      currentStock,
      minStockAlert,
    } = body;

    if (!outletId || (!allowedOutletIds.includes(outletId) && !isSuperAdmin)) {
      return NextResponse.json({ error: "Outlet tidak valid atau tidak memiliki akses" }, { status: 403 });
    }

    const price = parseFloat(purchasePrice) || 0;
    const pkgSize = parseFloat(packageSize) || 1;
    const yieldPct = parseFloat(yieldPercent) || 100;

    const ingredient = await prisma.ingredient.create({
      data: {
        outletId,
        name,
        sku: sku || undefined,
        category: category || "Other",
        supplier: supplier || undefined,
        purchasePrice: price,
        packageSize: pkgSize,
        purchaseUnit: purchaseUnit || "gr",
        yieldPercent: yieldPct,
        isPackaging: Boolean(isPackaging),
        currentStock: parseFloat(currentStock) || 0,
        minStockAlert: parseFloat(minStockAlert) || 0,
        priceHistory: {
          create: {
            price,
            packageSize: pkgSize,
            purchaseUnit: purchaseUnit || "gr",
            changePercent: 0,
            notes: "Pencatatan harga awal",
          },
        },
      },
    });

    return NextResponse.json(ingredient, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create ingredient:", error);
    return NextResponse.json(
      { error: error.message || "Gagal membuat bahan baku" },
      { status: 400 }
    );
  }
}
