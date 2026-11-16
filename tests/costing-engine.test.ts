import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatIDR,
  convertUnit,
  calculateEffectiveUnitCost,
  calculateSubRecipeCost,
  calculateMenuHPP,
  calculateBreakEvenPoint,
  classifyMenuMatrix,
} from "../src/lib/costing-engine";

describe("MarginOS Costing Engine Tests", () => {
  it("formatIDR properly formats IDR currency", () => {
    assert.equal(formatIDR(25000), "Rp 25.000");
    assert.equal(formatIDR(0), "Rp 0");
    assert.equal(formatIDR(1500000), "Rp 1.500.000");
  });

  it("convertUnit correctly converts weight units", () => {
    // 1 kg = 1000 gr
    assert.equal(convertUnit(1, "kg", "gr"), 1000);

    // 500 gr = 0.5 kg
    assert.equal(convertUnit(500, "gr", "kg"), 0.5);

    // 1 ons = 100 gr
    assert.equal(convertUnit(2, "ons", "gr"), 200);
  });

  it("convertUnit correctly converts volume units", () => {
    // 1 liter = 1000 ml
    assert.equal(convertUnit(1, "liter", "ml"), 1000);
    // 1 sdm = 15 ml
    assert.equal(convertUnit(2, "sdm", "ml"), 30);
    // 1 sdt = 5 ml
    assert.equal(convertUnit(3, "sdt", "ml"), 15);
  });

  it("calculateEffectiveUnitCost accounts for cleaning yield loss", () => {
    // Buy 1 kg (1000 gr) chicken for Rp 40.000, yield is 80% (20% trim loss)
    // Raw cost per gram: 40000 / 1000 = 40
    // Effective cost per gram: 40 / 0.8 = 50
    const result = calculateEffectiveUnitCost(40000, 1, "kg", "gr", 80);
    assert.equal(result.rawUnitCost, 40);
    assert.equal(result.effectiveUnitCost, 50);
    assert.equal(result.yieldMultiplier, 1.25);
  });

  it("calculateSubRecipeCost accurately batches ingredient costs", () => {
    // Espresso syrup batch: 100gr coffee (Rp 200/gr) + 200gr sugar (Rp 15/gr)
    // Total ingredients = 20.000 + 3.000 = 23.000
    // Labor = 2.000, Overhead = 1.000 -> Total = 26.000
    // Yield = 260 gr -> Cost per yield unit = 100/gr
    const items = [
      {
        purchasePrice: 200000,
        packageSize: 1000,
        purchaseUnit: "gr",
        quantity: 100,
        unit: "gr",
        yieldPercent: 100,
      },
      {
        purchasePrice: 15000,
        packageSize: 1000,
        purchaseUnit: "gr",
        quantity: 200,
        unit: "gr",
        yieldPercent: 100,
      },
    ];
    const subCost = calculateSubRecipeCost(items, 260, 2000, 1000);
    assert.equal(subCost.rawIngredientsCost, 23000);
    assert.equal(subCost.totalBatchCost, 26000);
    assert.equal(subCost.costPerYieldUnit, 100);
  });

  it("calculateMenuHPP calculates food cost, packaging, and waste", () => {
    const items = [
      {
        itemType: "ingredient" as const,
        name: "Meat Patty",
        quantity: 1,
        unit: "pcs",
        channel: "all" as const,
        unitCost: 10000,
        subtotal: 10000,
        isPackaging: false,
      },
      {
        itemType: "ingredient" as const,
        name: "Takeaway Box",
        quantity: 1,
        unit: "pcs",
        channel: "online_only" as const,
        unitCost: 2000,
        subtotal: 2000,
        isPackaging: true,
      },
    ];

    // Waste = 5% on 10.000 = 500, labor = 1000
    const hpp = calculateMenuHPP(items, 5, 1000);
    assert.equal(hpp.dineInBaseHPP, 11000); // 10000 + 1000 labor
    assert.equal(hpp.dineInWasteAmount, 500);
    assert.equal(hpp.dineInTotalHPP, 11500);
    assert.equal(hpp.packagingCost, 2000);
    assert.equal(hpp.onlineTotalHPP, 13500); // 10000 + 1000 + 2000 + 500 waste
  });

  it("calculateBreakEvenPoint determines break-even units and revenue accurately", () => {
    // Fixed cost Rp 15.000.000/mo, Price Rp 50.000, HPP Rp 20.000
    // Margin per unit = Rp 30.000, CM ratio = 60%
    // BEP Units = 15.000.000 / 30.000 = 500 units/mo
    // BEP Revenue = 500 * 50.000 = 25.000.000
    const bep = calculateBreakEvenPoint(15000000, 50000, 20000);
    assert.equal(bep.contributionMargin, 30000);
    assert.equal(bep.contributionMarginRatio, 0.6);
    assert.equal(bep.bepUnits, 500);
    assert.equal(bep.bepRevenue, 25000000);
  });

  it("classifyMenuMatrix correctly categorizes Boston Box matrix", () => {
    // Avg Margin = 15.000, Avg Volume = 100
    // High Margin, High Volume -> Star
    assert.equal(classifyMenuMatrix(20000, 150, 15000, 100).classification, "Star");
    // Low Margin, High Volume -> Plowhorse
    assert.equal(classifyMenuMatrix(10000, 150, 15000, 100).classification, "Plowhorse");
    // High Margin, Low Volume -> Puzzle
    assert.equal(classifyMenuMatrix(20000, 50, 15000, 100).classification, "Puzzle");
    // Low Margin, Low Volume -> Dog
    assert.equal(classifyMenuMatrix(10000, 50, 15000, 100).classification, "Dog");
  });
});
