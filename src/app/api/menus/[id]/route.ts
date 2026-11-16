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

    const existing = await prisma.menu.findUnique({ where: { id } });
    if (!existing || (!allowedOutletIds.includes(existing.outletId) && !isSuperAdmin)) {
      return NextResponse.json({ error: "Menu tidak ditemukan" }, { status: 404 });
    }

    const body = await req.json();
    const {
      name,
      sku,
      category,
      description,
      sellingPriceDineIn,
      sellingPriceOnline,
      monthlySalesVolume,
      wastePercent,
      directLaborCost,
      targetFoodCostPercent,
      onlinePlatformCommissionPercent,
      onlinePlatformFlatFee,
      merchantPromoSharePercent,
      recipeItems,
    } = body;

    const updated = await prisma.$transaction(async (tx) => {
      if (recipeItems && Array.isArray(recipeItems)) {
        await tx.menuRecipeItem.deleteMany({
          where: { menuId: id },
        });
      }

      return await tx.menu.update({
        where: { id },
        data: {
          name,
          sku: sku || undefined,
          category,
          description,
          sellingPriceDineIn: parseFloat(sellingPriceDineIn),
          sellingPriceOnline: parseFloat(sellingPriceOnline),
          monthlySalesVolume: parseInt(monthlySalesVolume),
          wastePercent: parseFloat(wastePercent),
          directLaborCost: parseFloat(directLaborCost) || 0,
          targetFoodCostPercent: parseFloat(targetFoodCostPercent) || 30.0,
          onlinePlatformCommissionPercent: parseFloat(onlinePlatformCommissionPercent) || 20.0,
          onlinePlatformFlatFee: parseFloat(onlinePlatformFlatFee) || 1000.0,
          merchantPromoSharePercent: parseFloat(merchantPromoSharePercent) || 0.0,
          recipeItems:
            recipeItems && Array.isArray(recipeItems)
              ? {
                  create: recipeItems.map((it: any) => ({
                    itemType: it.itemType || "ingredient",
                    ingredientId: it.itemType === "ingredient" ? it.ingredientId : null,
                    subRecipeId: it.itemType === "sub_recipe" ? it.subRecipeId : null,
                    quantity: parseFloat(it.quantity) || 0,
                    unit: it.unit || "gr",
                    channel: it.channel || "all",
                    notes: it.notes || undefined,
                  })),
                }
              : undefined,
        },
        include: {
          recipeItems: true,
        },
      });
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Failed to update menu:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memperbarui menu" },
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

    const existing = await prisma.menu.findUnique({ where: { id } });
    if (!existing || (!allowedOutletIds.includes(existing.outletId) && !isSuperAdmin)) {
      return NextResponse.json({ error: "Menu tidak ditemukan" }, { status: 404 });
    }

    await prisma.menu.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete menu:", error);
    return NextResponse.json(
      { error: "Gagal menghapus menu resep" },
      { status: 400 }
    );
  }
}
