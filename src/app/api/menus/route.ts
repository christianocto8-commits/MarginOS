import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-auth";
import {
  calculateEffectiveUnitCost,
  calculateSubRecipeCost,
  calculateMenuHPP,
  simulateOnlineFoodDelivery,
  classifyMenuMatrix,
  MenuCostItem,
} from "@/lib/costing-engine";

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

    const menus = await prisma.menu.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        outlet: true,
        recipeItems: {
          include: {
            ingredient: true,
            subRecipe: {
              include: {
                items: {
                  include: { ingredient: true },
                },
              },
            },
          },
        },
      },
    });

    // First pass: calculate HPP for all menus
    const calculatedMenus = menus.map((menu) => {
      const costItems: MenuCostItem[] = menu.recipeItems.map((item) => {
        let unitCost = 0;
        let itemName = "";
        let isPkg = false;

        if (item.itemType === "sub_recipe" && item.subRecipe) {
          itemName = item.subRecipe.name;
          const subItemsForCost = item.subRecipe.items.map((subItem) => ({
            purchasePrice: subItem.ingredient.purchasePrice,
            packageSize: subItem.ingredient.packageSize,
            purchaseUnit: subItem.ingredient.purchaseUnit,
            quantity: subItem.quantity,
            unit: subItem.unit,
            yieldPercent: subItem.ingredient.yieldPercent,
          }));
          const subCost = calculateSubRecipeCost(
            subItemsForCost,
            item.subRecipe.batchYield,
            item.subRecipe.directLaborCost,
            item.subRecipe.overheadCost
          );
          unitCost = subCost.costPerYieldUnit;
        } else if (item.ingredient) {
          itemName = item.ingredient.name;
          isPkg = item.ingredient.isPackaging;
          const { effectiveUnitCost } = calculateEffectiveUnitCost(
            item.ingredient.purchasePrice,
            item.ingredient.packageSize,
            item.ingredient.purchaseUnit,
            item.unit,
            item.ingredient.yieldPercent
          );
          unitCost = effectiveUnitCost;
        }

        return {
          itemType: (item.itemType as any) || "ingredient",
          name: itemName,
          quantity: item.quantity,
          unit: item.unit,
          channel: (item.channel as any) || "all",
          unitCost,
          subtotal: unitCost * item.quantity,
          isPackaging: isPkg,
        };
      });

      const hppBreakdown = calculateMenuHPP(
        costItems,
        menu.wastePercent,
        menu.directLaborCost
      );

      // Dine In Profitability
      const dineInGrossProfit = menu.sellingPriceDineIn - hppBreakdown.dineInTotalHPP;
      const dineInFoodCostPercent =
        menu.sellingPriceDineIn > 0
          ? (hppBreakdown.dineInTotalHPP / menu.sellingPriceDineIn) * 100
          : 0;
      const dineInMarginPercent =
        menu.sellingPriceDineIn > 0
          ? (dineInGrossProfit / menu.sellingPriceDineIn) * 100
          : 0;

      // Online Food Delivery (OFD) Simulation
      const ofdSim = simulateOnlineFoodDelivery(
        menu.sellingPriceDineIn,
        hppBreakdown.onlineTotalHPP,
        menu.onlinePlatformCommissionPercent,
        menu.onlinePlatformFlatFee,
        menu.merchantPromoSharePercent,
        menu.targetFoodCostPercent,
        menu.sellingPriceOnline
      );

      return {
        ...menu,
        costItems,
        hppBreakdown,
        dineIn: {
          totalHPP: hppBreakdown.dineInTotalHPP,
          baseHPP: hppBreakdown.dineInBaseHPP,
          wasteAmount: hppBreakdown.dineInWasteAmount,
          grossProfit: dineInGrossProfit,
          foodCostPercent: dineInFoodCostPercent,
          marginPercent: dineInMarginPercent,
          isHealthyFoodCost: dineInFoodCostPercent <= (menu.targetFoodCostPercent || 30),
        },
        online: {
          totalHPP: hppBreakdown.onlineTotalHPP,
          packagingCost: hppBreakdown.packagingCost,
          wasteAmount: hppBreakdown.onlineWasteAmount,
          recommendedPrice: ofdSim.recommendedOnlinePrice,
          actualPrice: ofdSim.actualOnlinePrice,
          platformDeduction: ofdSim.platformDeduction,
          merchantPromoDeduction: ofdSim.merchantPromoDeduction,
          netPayout: ofdSim.netPayoutToMerchant,
          netProfit: ofdSim.netProfit,
          netMarginPercent: ofdSim.netMarginPercent,
          foodCostPercent: ofdSim.foodCostPercent,
        },
      };
    });

    // Second pass: Calculate BCG Matrix averages
    const totalVolume = calculatedMenus.reduce(
      (sum, m) => sum + (m.monthlySalesVolume || 0),
      0
    );
    const avgVolume =
      calculatedMenus.length > 0 ? totalVolume / calculatedMenus.length : 100;

    const totalMargin = calculatedMenus.reduce(
      (sum, m) => sum + m.dineIn.grossProfit,
      0
    );
    const avgMargin =
      calculatedMenus.length > 0 ? totalMargin / calculatedMenus.length : 10000;

    const enrichedWithMatrix = calculatedMenus.map((menu) => {
      const matrix = classifyMenuMatrix(
        menu.dineIn.grossProfit,
        menu.monthlySalesVolume,
        avgMargin,
        avgVolume
      );
      return {
        ...menu,
        matrix,
      };
    });

    return NextResponse.json({
      menus: enrichedWithMatrix,
      averages: {
        avgVolume,
        avgMargin,
        totalVolume,
      },
    });
  } catch (error) {
    console.error("Failed to fetch menus:", error);
    return NextResponse.json(
      { error: "Gagal memuat menu resep" },
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
      recipeItems, // Array of { itemType, ingredientId, subRecipeId, quantity, unit, channel, notes }
    } = body;

    if (!outletId || (!allowedOutletIds.includes(outletId) && !isSuperAdmin)) {
      return NextResponse.json({ error: "Outlet tidak valid atau tidak memiliki akses" }, { status: 403 });
    }

    const menu = await prisma.menu.create({
      data: {
        outletId,
        name,
        sku: sku || undefined,
        category: category || "Main Course",
        description,
        sellingPriceDineIn: parseFloat(sellingPriceDineIn) || 0,
        sellingPriceOnline:
          parseFloat(sellingPriceOnline) || parseFloat(sellingPriceDineIn) || 0,
        monthlySalesVolume: parseInt(monthlySalesVolume) || 100,
        wastePercent: parseFloat(wastePercent) || 2.0,
        directLaborCost: parseFloat(directLaborCost) || 0,
        targetFoodCostPercent: parseFloat(targetFoodCostPercent) || 30.0,
        onlinePlatformCommissionPercent:
          parseFloat(onlinePlatformCommissionPercent) || 20.0,
        onlinePlatformFlatFee: parseFloat(onlinePlatformFlatFee) || 1000.0,
        merchantPromoSharePercent: parseFloat(merchantPromoSharePercent) || 0.0,
        recipeItems: {
          create: (recipeItems || []).map((it: any) => ({
            itemType: it.itemType || "ingredient",
            ingredientId: it.itemType === "ingredient" ? it.ingredientId : null,
            subRecipeId: it.itemType === "sub_recipe" ? it.subRecipeId : null,
            quantity: parseFloat(it.quantity) || 0,
            unit: it.unit || "gr",
            channel: it.channel || "all",
            notes: it.notes || undefined,
          })),
        },
      },
      include: {
        recipeItems: true,
      },
    });

    return NextResponse.json(menu, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create menu:", error);
    return NextResponse.json(
      { error: error.message || "Gagal membuat menu resep" },
      { status: 400 }
    );
  }
}
