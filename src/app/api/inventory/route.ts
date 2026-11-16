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
    const where: any = { outletId: { in: targetOutletIds } };

    const periods = await prisma.inventoryPeriod.findMany({
      where,
      orderBy: { startDate: "desc" },
      include: {
        outlet: {
          select: { name: true, category: true },
        },
        logs: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    return NextResponse.json(periods);
  } catch (error) {
    console.error("Failed to fetch inventory periods:", error);
    return NextResponse.json(
      { error: "Gagal memuat periode audit inventori" },
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
      periodName,
      startDate,
      endDate,
      totalRevenue,
      theoreticalCOGS,
      notes,
      logs, // Array of { ingredientId, beginningStock, purchases, endingStock, theoreticalUsage, unitCost, notes }
    } = body;

    if (!outletId || (!allowedOutletIds.includes(outletId) && !isSuperAdmin)) {
      return NextResponse.json({ error: "Outlet tidak valid atau tidak memiliki akses" }, { status: 403 });
    }

    let totalActualCOGS = 0;
    const processedLogs = (logs || []).map((l: any) => {
      const beg = parseFloat(l.beginningStock) || 0;
      const purch = parseFloat(l.purchases) || 0;
      const end = parseFloat(l.endingStock) || 0;
      const cost = parseFloat(l.unitCost) || 0;
      const theoUsage = parseFloat(l.theoreticalUsage) || 0;

      // Actual Usage = (Beginning + Purchases) - Ending
      const actualUsage = Math.max(0, beg + purch - end);
      const varianceQty = actualUsage - theoUsage;
      const varianceCost = varianceQty * cost;

      totalActualCOGS += actualUsage * cost;

      return {
        ingredientId: l.ingredientId,
        beginningStock: beg,
        purchases: purch,
        endingStock: end,
        unitCost: cost,
        theoreticalUsage: theoUsage,
        actualUsage,
        varianceQty,
        varianceCost,
        notes: l.notes || undefined,
      };
    });

    const theoCOGS = parseFloat(theoreticalCOGS) || 0;
    const varianceAmount = totalActualCOGS - theoCOGS;
    const variancePercent =
      theoCOGS > 0 ? (varianceAmount / theoCOGS) * 100 : 0;

    const period = await prisma.inventoryPeriod.create({
      data: {
        outletId,
        periodName,
        startDate: new Date(startDate || Date.now()),
        endDate: new Date(endDate || Date.now()),
        status: "closed",
        totalRevenue: parseFloat(totalRevenue) || 0,
        theoreticalCOGS: theoCOGS,
        actualCOGS: totalActualCOGS,
        varianceAmount,
        variancePercent,
        notes,
        logs: {
          create: processedLogs,
        },
      },
      include: {
        logs: {
          include: { ingredient: true },
        },
      },
    });

    return NextResponse.json(period, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create inventory period:", error);
    return NextResponse.json(
      { error: error.message || "Gagal membuat laporan audit stok opname" },
      { status: 400 }
    );
  }
}
