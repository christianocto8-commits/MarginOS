import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-auth";
import {
  calculateEffectiveUnitCost,
  calculateSubRecipeCost,
  calculateMenuHPP,
  calculateBEP,
  classifyMenuMatrix,
  MenuCostItem,
} from "@/lib/costing-engine";

export async function GET(req: Request) {
  try {
    const { error, allowedOutletIds, isSuperAdmin } = await getTenantContext();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const outletId = searchParams.get("outletId");

    // Fetch active outlet strictly within authorized outlets for this tenant
    const activeOutlet = outletId
      ? await prisma.outlet.findFirst({
          where: isSuperAdmin
            ? { id: outletId }
            : allowedOutletIds.includes(outletId)
            ? { id: outletId }
            : { id: "__unauthorized__" },
        })
      : await prisma.outlet.findFirst({
          where: isSuperAdmin ? {} : { id: { in: allowedOutletIds } },
          orderBy: { createdAt: "asc" },
        });

    if (!activeOutlet) {
      return NextResponse.json({ error: "Tidak ada outlet yang ditemukan untuk akun Anda" }, { status: 404 });
    }

    // Fetch all ingredients for this outlet
    const ingredients = await prisma.ingredient.findMany({
      where: { outletId: activeOutlet.id },
      include: {
        priceHistory: {
          orderBy: { effectiveDate: "desc" },
          take: 2,
        },
      },
    });

    // Fetch all menus with recipes
    const menus = await prisma.menu.findMany({
      where: { outletId: activeOutlet.id },
      include: {
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

    // Fetch latest inventory period
    const latestPeriod = await prisma.inventoryPeriod.findFirst({
      where: { outletId: activeOutlet.id },
      orderBy: { startDate: "desc" },
      include: {
        logs: {
          include: { ingredient: true },
          orderBy: { varianceCost: "desc" },
          take: 5,
        },
      },
    });

    // Map ingredients usage to find Top Cost Drivers
    const ingredientCostContribution: Record<
      string,
      { name: string; category: string; totalCostMonthly: number; unit: string }
    > = {};

    // Calculate all menus HPP
    const processedMenus = menus.map((menu) => {
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

          // Track monthly ingredient usage
          const monthlyUsageCost = unitCost * item.quantity * menu.monthlySalesVolume;
          if (!ingredientCostContribution[item.ingredient.id]) {
            ingredientCostContribution[item.ingredient.id] = {
              name: item.ingredient.name,
              category: item.ingredient.category,
              totalCostMonthly: 0,
              unit: item.unit,
            };
          }
          ingredientCostContribution[item.ingredient.id].totalCostMonthly += monthlyUsageCost;
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

      const hpp = calculateMenuHPP(costItems, menu.wastePercent, menu.directLaborCost);
      const grossProfit = menu.sellingPriceDineIn - hpp.dineInTotalHPP;
      const foodCostPct =
        menu.sellingPriceDineIn > 0 ? (hpp.dineInTotalHPP / menu.sellingPriceDineIn) * 100 : 0;
      const marginPct =
        menu.sellingPriceDineIn > 0 ? (grossProfit / menu.sellingPriceDineIn) * 100 : 0;

      return {
        id: menu.id,
        name: menu.name,
        category: menu.category,
        sellingPrice: menu.sellingPriceDineIn,
        sellingPriceOnline: menu.sellingPriceOnline,
        totalHPP: hpp.dineInTotalHPP,
        onlineHPP: hpp.onlineTotalHPP,
        salesVolume: menu.monthlySalesVolume,
        grossProfit,
        foodCostPct,
        marginPct,
      };
    });

    // Top Cost Drivers (sorted by highest monthly cost)
    const topCostDrivers = Object.values(ingredientCostContribution)
      .sort((a, b) => b.totalCostMonthly - a.totalCostMonthly)
      .slice(0, 5);

    // Cost by Category Distribution
    const costByCategory: Record<string, number> = {};
    Object.values(ingredientCostContribution).forEach((item) => {
      costByCategory[item.category] =
        (costByCategory[item.category] || 0) + item.totalCostMonthly;
    });

    const categoryDistribution = Object.entries(costByCategory).map(([category, cost]) => ({
      name: category,
      value: Math.round(cost),
    }));

    // Food Cost & Margin Averages
    const totalVolume = processedMenus.reduce((sum, m) => sum + m.salesVolume, 0);
    const avgVolume = processedMenus.length > 0 ? totalVolume / processedMenus.length : 100;

    let weightedFoodCostSum = 0;
    let totalRevenue = 0;
    let totalHPPExpense = 0;

    processedMenus.forEach((m) => {
      totalRevenue += m.sellingPrice * m.salesVolume;
      totalHPPExpense += m.totalHPP * m.salesVolume;
      weightedFoodCostSum += m.foodCostPct * m.salesVolume;
    });

    const averageFoodCostPct =
      totalVolume > 0 ? weightedFoodCostSum / totalVolume : 28.0;

    // Status: Healthy (<30%), Warning (30-35%), Critical (>35%)
    let foodCostStatus: "healthy" | "warning" | "critical" = "healthy";
    if (averageFoodCostPct > 35) {
      foodCostStatus = "critical";
    } else if (averageFoodCostPct >= 30) {
      foodCostStatus = "warning";
    }

    // Top & Lowest Margin Menus
    const sortedByMargin = [...processedMenus].sort((a, b) => b.marginPct - a.marginPct);
    const topMarginMenu = sortedByMargin[0] || null;
    const lowestMarginMenu = sortedByMargin[sortedByMargin.length - 1] || null;

    // BCG Matrix Counts
    const avgMarginRp =
      processedMenus.length > 0
        ? processedMenus.reduce((s, m) => s + m.grossProfit, 0) / processedMenus.length
        : 10000;

    const bcgCounts = {
      stars: 0,
      plowhorses: 0,
      puzzles: 0,
      dogs: 0,
    };

    processedMenus.forEach((m) => {
      const { classification } = classifyMenuMatrix(
        m.grossProfit,
        m.salesVolume,
        avgMarginRp,
        avgVolume
      );
      if (classification === "Star") bcgCounts.stars++;
      if (classification === "Plowhorse") bcgCounts.plowhorses++;
      if (classification === "Puzzle") bcgCounts.puzzles++;
      if (classification === "Dog") bcgCounts.dogs++;
    });

    // Break-Even Point (BEP)
    const bepData = calculateBEP(
      activeOutlet.monthlyFixedCost,
      processedMenus.map((m) => ({
        name: m.name,
        sellingPrice: m.sellingPrice,
        totalHPP: m.totalHPP,
        salesVolume: m.salesVolume,
      }))
    );

    // Inflation / Price Increases Alert Count
    let ingredientsWithPriceIncrease = 0;
    ingredients.forEach((ing) => {
      if (ing.priceHistory.length >= 2) {
        if (ing.priceHistory[0].price > ing.priceHistory[1].price) {
          ingredientsWithPriceIncrease++;
        }
      }
    });

    return NextResponse.json({
      outlet: activeOutlet,
      kpis: {
        averageFoodCostPct,
        foodCostStatus,
        targetFoodCostPct: activeOutlet.targetFoodCostPercent,
        totalMonthlyRevenue: totalRevenue,
        totalMonthlyHPP: totalHPPExpense,
        totalMonthlyGrossProfit: totalRevenue - totalHPPExpense,
        topMarginMenu,
        lowestMarginMenu,
        ingredientsCount: ingredients.length,
        subRecipesCount: await prisma.subRecipe.count({ where: { outletId: activeOutlet.id } }),
        menusCount: menus.length,
        ingredientsWithPriceIncrease,
      },
      bep: bepData,
      bcgCounts,
      topCostDrivers,
      categoryDistribution,
      latestPeriod,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { error: "Gagal memuat data ringkasan eksekutif" },
      { status: 500 }
    );
  }
}
