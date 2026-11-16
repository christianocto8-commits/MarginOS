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

    const existing = await prisma.subRecipe.findUnique({ where: { id } });
    if (!existing || (!allowedOutletIds.includes(existing.outletId) && !isSuperAdmin)) {
      return NextResponse.json({ error: "Sub-resep tidak ditemukan" }, { status: 404 });
    }

    const body = await req.json();
    const {
      name,
      category,
      description,
      batchYield,
      batchUnit,
      shelfLifeDays,
      storageMethod,
      directLaborCost,
      overheadCost,
      items,
    } = body;

    // Use transaction to delete old items and insert updated items
    const updated = await prisma.$transaction(async (tx) => {
      if (items && Array.isArray(items)) {
        await tx.subRecipeItem.deleteMany({
          where: { subRecipeId: id },
        });
      }

      return await tx.subRecipe.update({
        where: { id },
        data: {
          name,
          category,
          description,
          batchYield: parseFloat(batchYield),
          batchUnit,
          shelfLifeDays: parseInt(shelfLifeDays),
          storageMethod,
          directLaborCost: parseFloat(directLaborCost) || 0,
          overheadCost: parseFloat(overheadCost) || 0,
          items:
            items && Array.isArray(items)
              ? {
                  create: items.map((it: any) => ({
                    ingredientId: it.ingredientId,
                    quantity: parseFloat(it.quantity) || 0,
                    unit: it.unit || "gr",
                    notes: it.notes || undefined,
                  })),
                }
              : undefined,
        },
        include: {
          items: {
            include: { ingredient: true },
          },
        },
      });
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Failed to update sub-recipe:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memperbarui sub-resep" },
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

    const existing = await prisma.subRecipe.findUnique({ where: { id } });
    if (!existing || (!allowedOutletIds.includes(existing.outletId) && !isSuperAdmin)) {
      return NextResponse.json({ error: "Sub-resep tidak ditemukan" }, { status: 404 });
    }

    // Check if used in menu recipes
    const usedInRecipes = await prisma.menuRecipeItem.count({
      where: { subRecipeId: id },
    });

    if (usedInRecipes > 0) {
      return NextResponse.json(
        {
          error: `Sub-resep tidak dapat dihapus karena masih digunakan dalam ${usedInRecipes} resep menu aktif. Hapus dari resep terlebih dahulu.`,
        },
        { status: 400 }
      );
    }

    await prisma.subRecipe.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete sub-recipe:", error);
    return NextResponse.json(
      { error: "Gagal menghapus sub-resep" },
      { status: 400 }
    );
  }
}
