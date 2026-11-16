import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-auth";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, allowedOutletIds, isSuperAdmin } = await getTenantContext();
    if (error) return error;

    const { id } = await params;

    const existing = await prisma.ingredient.findUnique({
      where: { id },
    });

    if (!existing || (!allowedOutletIds.includes(existing.outletId) && !isSuperAdmin)) {
      return NextResponse.json({ error: "Bahan tidak ditemukan" }, { status: 404 });
    }

    const body = await req.json();
    const {
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
      priceChangeNotes,
    } = body;

    const newPrice = parseFloat(purchasePrice) || existing.purchasePrice;
    const newPkgSize = parseFloat(packageSize) || existing.packageSize;
    const newUnit = purchaseUnit || existing.purchaseUnit;

    // Check if price changed -> record into IngredientPriceHistory
    const priceChanged = Math.abs(newPrice - existing.purchasePrice) > 0.01;

    let changePercent = 0;
    if (priceChanged && existing.purchasePrice > 0) {
      changePercent = ((newPrice - existing.purchasePrice) / existing.purchasePrice) * 100;
    }

    const updated = await prisma.ingredient.update({
      where: { id },
      data: {
        name,
        sku: sku || undefined,
        category,
        supplier: supplier || undefined,
        purchasePrice: newPrice,
        packageSize: newPkgSize,
        purchaseUnit: newUnit,
        yieldPercent: parseFloat(yieldPercent) ?? existing.yieldPercent,
        isPackaging: Boolean(isPackaging),
        currentStock: parseFloat(currentStock) ?? existing.currentStock,
        minStockAlert: parseFloat(minStockAlert) ?? existing.minStockAlert,
        priceHistory: priceChanged
          ? {
              create: {
                price: newPrice,
                packageSize: newPkgSize,
                purchaseUnit: newUnit,
                changePercent,
                notes: priceChangeNotes || "Pembaruan harga dari edit bahan baku",
              },
            }
          : undefined,
      },
      include: {
        priceHistory: {
          orderBy: { effectiveDate: "desc" },
          take: 5,
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Failed to update ingredient:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memperbarui bahan baku" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, allowedOutletIds, isSuperAdmin } = await getTenantContext();
    if (error) return error;

    const { id } = await params;

    const existing = await prisma.ingredient.findUnique({
      where: { id },
    });

    if (!existing || (!allowedOutletIds.includes(existing.outletId) && !isSuperAdmin)) {
      return NextResponse.json({ error: "Bahan tidak ditemukan" }, { status: 404 });
    }

    // Check if used in menu recipes
    const usedInRecipes = await prisma.menuRecipeItem.count({
      where: { ingredientId: id },
    });

    if (usedInRecipes > 0) {
      return NextResponse.json(
        {
          error: `Bahan tidak dapat dihapus karena masih digunakan dalam ${usedInRecipes} resep menu aktif. Hapus dari resep terlebih dahulu.`,
        },
        { status: 400 }
      );
    }

    await prisma.ingredient.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete ingredient:", error);
    return NextResponse.json(
      { error: "Gagal menghapus bahan baku" },
      { status: 400 }
    );
  }
}
