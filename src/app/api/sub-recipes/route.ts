import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-auth";
import { calculateSubRecipeCost } from "@/lib/costing-engine";

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

    const subRecipes = await prisma.subRecipe.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        outlet: {
          select: { name: true, category: true },
        },
        items: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    const enriched = subRecipes.map((sub) => {
      const itemsForCosting = sub.items.map((item) => ({
        purchasePrice: item.ingredient.purchasePrice,
        packageSize: item.ingredient.packageSize,
        purchaseUnit: item.ingredient.purchaseUnit,
        quantity: item.quantity,
        unit: item.unit,
        yieldPercent: item.ingredient.yieldPercent,
      }));

      const { rawIngredientsCost, totalBatchCost, costPerYieldUnit } =
        calculateSubRecipeCost(
          itemsForCosting,
          sub.batchYield,
          sub.directLaborCost,
          sub.overheadCost
        );

      return {
        ...sub,
        rawIngredientsCost,
        totalBatchCost,
        costPerYieldUnit,
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Failed to fetch sub-recipes:", error);
    return NextResponse.json(
      { error: "Gagal memuat sub-resep" },
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
      category,
      description,
      batchYield,
      batchUnit,
      shelfLifeDays,
      storageMethod,
      directLaborCost,
      overheadCost,
      items, // Array of { ingredientId, quantity, unit, notes }
    } = body;

    if (!outletId || (!allowedOutletIds.includes(outletId) && !isSuperAdmin)) {
      return NextResponse.json({ error: "Outlet tidak valid atau tidak memiliki akses" }, { status: 403 });
    }

    const subRecipe = await prisma.subRecipe.create({
      data: {
        outletId,
        name,
        category: category || "Syrup/Sauce",
        description,
        batchYield: parseFloat(batchYield) || 1,
        batchUnit: batchUnit || "gr",
        shelfLifeDays: parseInt(shelfLifeDays) || 7,
        storageMethod,
        directLaborCost: parseFloat(directLaborCost) || 0,
        overheadCost: parseFloat(overheadCost) || 0,
        items: {
          create: (items || []).map((it: any) => ({
            ingredientId: it.ingredientId,
            quantity: parseFloat(it.quantity) || 0,
            unit: it.unit || "gr",
            notes: it.notes || undefined,
          })),
        },
      },
      include: {
        items: {
          include: { ingredient: true },
        },
      },
    });

    return NextResponse.json(subRecipe, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create sub-recipe:", error);
    return NextResponse.json(
      { error: error.message || "Gagal membuat sub-resep" },
      { status: 400 }
    );
  }
}
