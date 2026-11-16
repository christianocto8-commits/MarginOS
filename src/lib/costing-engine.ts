/**
 * MarginOS - F&B Costing & Recipe Engineering Calculation Engine
 * High precision unit conversion, yield calculation, sub-recipe batching,
 * and multi-channel online food delivery (OFD) pricing simulators.
 */

export type UnitType = "weight" | "volume" | "count" | "other";

export interface UnitDefinition {
  name: string;
  type: UnitType;
  baseRatio: number; // Ratio relative to base unit (gr for weight, ml for volume, pcs for count)
}

export const UNIT_REGISTRY: Record<string, UnitDefinition> = {
  // Weight (Base: gr)
  kg: { name: "Kilogram", type: "weight", baseRatio: 1000 },
  gr: { name: "Gram", type: "weight", baseRatio: 1 },
  g: { name: "Gram", type: "weight", baseRatio: 1 },
  mg: { name: "Miligram", type: "weight", baseRatio: 0.001 },
  ons: { name: "Ons (100gr)", type: "weight", baseRatio: 100 },

  // Volume (Base: ml)
  liter: { name: "Liter", type: "volume", baseRatio: 1000 },
  l: { name: "Liter", type: "volume", baseRatio: 1000 },
  ml: { name: "Mililiter", type: "volume", baseRatio: 1 },
  oz: { name: "Fluid Ounce (Fl Oz)", type: "volume", baseRatio: 29.5735 },
  cup: { name: "Cup Standar (240ml)", type: "volume", baseRatio: 240 },
  sdm: { name: "Sendok Makan (15ml)", type: "volume", baseRatio: 15 },
  sdt: { name: "Sendok Teh (5ml)", type: "volume", baseRatio: 5 },

  // Count / Discrete (Base: pcs)
  pcs: { name: "Pieces / Buah", type: "count", baseRatio: 1 },
  butir: { name: "Butir", type: "count", baseRatio: 1 },
  lembar: { name: "Lembar", type: "count", baseRatio: 1 },
  porsi: { name: "Porsi", type: "count", baseRatio: 1 },
  pack: { name: "Pack", type: "count", baseRatio: 1 },
  karton: { name: "Karton / Dus", type: "count", baseRatio: 1 },
  ikat: { name: "Ikat", type: "count", baseRatio: 1 },
  kaleng: { name: "Kaleng", type: "count", baseRatio: 1 },
  botol: { name: "Botol", type: "count", baseRatio: 1 },
};

/**
 * Format number to Indonesian Rupiah currency string (e.g. Rp 25.000)
 */
export function formatIDR(value: number): string {
  if (isNaN(value) || value === null || value === undefined) return "Rp 0";
  const rounded = Math.round(value);
  return "Rp " + rounded.toLocaleString("id-ID");
}

/**
 * Format decimal numbers cleanly (e.g. 46,67 or 12,5%)
 */
export function formatNumber(value: number, decimals: number = 2): string {
  if (isNaN(value) || value === null || value === undefined) return "0";
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Convert quantity from source unit to target unit within the same dimension.
 * Falls back to 1:1 if units belong to different dimensions or count units.
 */
export function convertUnit(
  quantity: number,
  fromUnit: string,
  toUnit: string
): number {
  if (!quantity) return 0;
  const fromNormalized = fromUnit.trim().toLowerCase();
  const toNormalized = toUnit.trim().toLowerCase();

  if (fromNormalized === toNormalized) return quantity;

  const fromDef = UNIT_REGISTRY[fromNormalized];
  const toDef = UNIT_REGISTRY[toNormalized];

  if (!fromDef || !toDef) {
    // If not registered, return quantity as-is
    return quantity;
  }

  // Cross-dimension check (e.g. weight to weight, volume to volume)
  if (fromDef.type === toDef.type) {
    const baseQuantity = quantity * fromDef.baseRatio;
    return baseQuantity / toDef.baseRatio;
  }

  // Handle common density assumptions if cross weight/volume (e.g. 1 ml of water = 1 gr)
  if (
    (fromDef.type === "weight" && toDef.type === "volume") ||
    (fromDef.type === "volume" && toDef.type === "weight")
  ) {
    const baseQuantity = quantity * fromDef.baseRatio; // in gr or ml
    return baseQuantity / toDef.baseRatio;
  }

  return quantity;
}

/**
 * Calculate the Effective Cost per recipe unit taking into account:
 * 1. Package Size and Purchase Price
 * 2. Trimming & Cleaning Yield %:
 *    Effective Cost = (Purchase Price / Package Size in recipe unit) / (Yield% / 100)
 *
 * Example:
 * 1 kg Ayam Broiler = Rp 35.000. Yield 75%.
 * Recipe uses grams (gr).
 * Package in recipe unit (gr) = 1.000 gr.
 * Raw cost = 35.000 / 1.000 = Rp 35/gr.
 * Effective cost per edible gram = 35 / 0.75 = Rp 46.67/gr.
 */
export function calculateEffectiveUnitCost(
  purchasePrice: number,
  packageSize: number,
  purchaseUnit: string,
  recipeUnit: string,
  yieldPercent: number = 100
): {
  rawUnitCost: number;
  effectiveUnitCost: number;
  yieldMultiplier: number;
} {
  const safeYield = Math.max(1, Math.min(100, yieldPercent || 100));
  const safePackageSize = Math.max(0.0001, packageSize || 1);

  // Convert package size to recipe unit
  const packageSizeInRecipeUnit = convertUnit(
    safePackageSize,
    purchaseUnit,
    recipeUnit
  );

  const rawUnitCost = purchasePrice / packageSizeInRecipeUnit;
  const yieldMultiplier = 100 / safeYield;
  const effectiveUnitCost = rawUnitCost * yieldMultiplier;

  return {
    rawUnitCost,
    effectiveUnitCost,
    yieldMultiplier,
  };
}

/**
 * Calculate total batch cost and cost per finished unit for Sub-Recipes
 */
export function calculateSubRecipeCost(
  items: Array<{
    purchasePrice: number;
    packageSize: number;
    purchaseUnit: string;
    quantity: number;
    unit: string;
    yieldPercent?: number;
  }>,
  batchYield: number,
  directLaborCost: number = 0,
  overheadCost: number = 0
): {
  rawIngredientsCost: number;
  totalBatchCost: number;
  costPerYieldUnit: number;
} {
  let rawIngredientsCost = 0;

  for (const item of items) {
    const { effectiveUnitCost } = calculateEffectiveUnitCost(
      item.purchasePrice,
      item.packageSize,
      item.purchaseUnit,
      item.unit,
      item.yieldPercent ?? 100
    );
    rawIngredientsCost += effectiveUnitCost * item.quantity;
  }

  const totalBatchCost = rawIngredientsCost + (directLaborCost || 0) + (overheadCost || 0);
  const safeYield = Math.max(0.0001, batchYield || 1);
  const costPerYieldUnit = totalBatchCost / safeYield;

  return {
    rawIngredientsCost,
    totalBatchCost,
    costPerYieldUnit,
  };
}

export interface MenuCostItem {
  itemType: "ingredient" | "sub_recipe";
  name: string;
  quantity: number;
  unit: string;
  channel: "all" | "dine_in_only" | "online_only";
  unitCost: number;
  subtotal: number;
  isPackaging?: boolean;
}

/**
 * Calculate complete Menu HPP breakdown for Dine-In and Online Delivery channels
 */
export function calculateMenuHPP(
  items: MenuCostItem[],
  wastePercent: number = 2.0,
  directLaborCost: number = 0
): {
  dineInBaseHPP: number;
  dineInWasteAmount: number;
  dineInTotalHPP: number;

  onlineBaseHPP: number;
  onlineWasteAmount: number;
  onlineTotalHPP: number;

  packagingCost: number;
  itemsBreakdown: MenuCostItem[];

  baseIngredientsCost: number;
  wasteCost: number;
} {
  let dineInFoodCost = 0;
  let onlineFoodCost = 0;
  let packagingCost = 0;

  const itemsBreakdown = items.map((item) => {
    const subtotal = item.quantity * item.unitCost;

    if (item.channel === "all" || item.channel === "dine_in_only") {
      dineInFoodCost += subtotal;
    }

    if (item.channel === "all" || item.channel === "online_only") {
      onlineFoodCost += subtotal;
    }

    if (item.isPackaging || item.channel === "online_only") {
      packagingCost += subtotal;
    }

    return {
      ...item,
      subtotal,
    };
  });

  const safeWaste = Math.max(0, wastePercent || 0) / 100;
  const labor = directLaborCost || 0;

  const dineInBaseHPP = dineInFoodCost + labor;
  const dineInWasteAmount = dineInFoodCost * safeWaste;
  const dineInTotalHPP = dineInBaseHPP + dineInWasteAmount;

  const onlineBaseHPP = onlineFoodCost + labor;
  const onlineWasteAmount = (onlineFoodCost - packagingCost) * safeWaste; // Packaging usually not prone to recipe waste
  const onlineTotalHPP = onlineBaseHPP + onlineWasteAmount;

  return {
    dineInBaseHPP,
    dineInWasteAmount,
    dineInTotalHPP,
    onlineBaseHPP,
    onlineWasteAmount,
    onlineTotalHPP,
    packagingCost,
    itemsBreakdown,
    baseIngredientsCost: dineInFoodCost,
    wasteCost: dineInWasteAmount,
  };
}

/**
 * Simulate Online Delivery Platform (GoFood / GrabFood / ShopeeFood) Economics
 */
export function simulateOnlineFoodDelivery(
  dineInSellingPrice: number,
  deliveryHPP: number,
  platformCommissionPercent: number = 20.0, // 20%
  platformFlatFee: number = 1000.0, // Rp 1.000
  merchantPromoSharePercent: number = 0.0, // e.g. 10%
  _targetOnlineFoodCostPercent: number = 30.0,
  manualOnlinePrice?: number
): {
  recommendedOnlinePrice: number;
  actualOnlinePrice: number;
  platformDeduction: number;
  merchantPromoDeduction: number;
  netPayoutToMerchant: number;
  netProfit: number;
  netMarginPercent: number;
  foodCostPercent: number;

  commissionAmount: number;
  flatFeeAmount: number;
  merchantPromoAmount: number;
  netPayoutToRestaurant: number;
} {
  // Formula to maintain same gross revenue as Dine In:
  // Recommended Price = (DineInPrice + FlatFee) / (1 - (Commission% + Promo%) / 100)
  const totalDeductionPercent =
    (platformCommissionPercent + merchantPromoSharePercent) / 100;
  const denominator = Math.max(0.1, 1 - totalDeductionPercent);

  const exactRecommended = (dineInSellingPrice + platformFlatFee) / denominator;
  // Round up to nearest Rp 500 for Indonesian F&B menu convention
  const recommendedOnlinePrice = Math.ceil(exactRecommended / 500) * 500;

  const actualOnlinePrice = manualOnlinePrice && manualOnlinePrice > 0
    ? manualOnlinePrice
    : recommendedOnlinePrice;

  const platformDeduction =
    actualOnlinePrice * (platformCommissionPercent / 100) + platformFlatFee;
  const merchantPromoDeduction =
    actualOnlinePrice * (merchantPromoSharePercent / 100);

  const netPayoutToMerchant =
    actualOnlinePrice - platformDeduction - merchantPromoDeduction;

  const netProfit = netPayoutToMerchant - deliveryHPP;
  const netMarginPercent =
    actualOnlinePrice > 0 ? (netProfit / actualOnlinePrice) * 100 : 0;
  const foodCostPercent =
    netPayoutToMerchant > 0 ? (deliveryHPP / netPayoutToMerchant) * 100 : 0;

  const commissionAmount = actualOnlinePrice * (platformCommissionPercent / 100);
  const flatFeeAmount = platformFlatFee;
  const merchantPromoAmount = merchantPromoDeduction;
  const netPayoutToRestaurant = netPayoutToMerchant;

  return {
    recommendedOnlinePrice,
    actualOnlinePrice,
    platformDeduction,
    merchantPromoDeduction,
    netPayoutToMerchant,
    netProfit,
    netMarginPercent,
    foodCostPercent,
    commissionAmount,
    flatFeeAmount,
    merchantPromoAmount,
    netPayoutToRestaurant,
  };
}

/**
 * Menu Engineering Matrix Quadrant (BCG F&B Matrix):
 * - Stars: High Margin, High Volume (Pertahankan kualitas & branding)
 * - Plowhorses: Low Margin, High Volume (Naikkan harga sedikit / kurangi porsi/waste)
 * - Puzzles: High Margin, Low Volume (Tingkatkan promosi / reposisi di menu)
 * - Dogs: Low Margin, Low Volume (Evaluasi / hilangkan dari menu)
 */
export type MenuMatrixClassification = "Star" | "Plowhorse" | "Puzzle" | "Dog";

export function classifyMenuMatrix(
  marginRp: number,
  salesVolume: number,
  averageMarginRp: number,
  averageVolume: number
): {
  classification: MenuMatrixClassification;
  badgeColor: string;
  badgeBg: string;
  recommendation: string;
} {
  const isHighMargin = marginRp >= averageMarginRp;
  const isHighVolume = salesVolume >= averageVolume;

  if (isHighMargin && isHighVolume) {
    return {
      classification: "Star",
      badgeColor: "text-emerald-700",
      badgeBg: "bg-emerald-50 border-emerald-200",
      recommendation:
        "Bintang Menu! Volume dan Margin tinggi. Pertahankan konsistensi rasa, kualitas bahan, dan letakkan di posisi teratas menu.",
    };
  }

  if (!isHighMargin && isHighVolume) {
    return {
      classification: "Plowhorse",
      badgeColor: "text-blue-700",
      badgeBg: "bg-blue-50 border-blue-200",
      recommendation:
        "Sangat laris namun margin tipis. Rekomendasi: Naikkan harga Rp 1.000–2.000, optimalkan takaran resep, atau tawarkan bundling.",
    };
  }

  if (isHighMargin && !isHighVolume) {
    return {
      classification: "Puzzle",
      badgeColor: "text-amber-700",
      badgeBg: "bg-amber-50 border-amber-200",
      recommendation:
        "Margin sangat menguntungkan tapi penjualan rendah. Rekomendasi: Beri foto menarik, promo pairing (upsell kasir), atau ganti nama menu.",
    };
  }

  return {
    classification: "Dog",
    badgeColor: "text-rose-700",
    badgeBg: "bg-rose-50 border-rose-200",
    recommendation:
      "Performa kritis (margin rendah & volume sepi). Beban inventori bahan. Pertimbangkan reformulasi resep atau hapus dari menu aktif.",
  };
}

/**
 * Break-Even Point (BEP) Calculator
 */
export function calculateBEP(
  monthlyFixedCost: number, // Gaji tetap, sewa tempat, listrik, internet
  menus: Array<{
    name: string;
    sellingPrice: number;
    totalHPP: number;
    salesVolume: number;
  }>
): {
  totalFixedCost: number;
  weightedContributionMargin: number;
  totalMonthlyPortionsBEP: number;
  totalRevenueBEP: number;
  currentMonthlyPortions: number;
  currentMonthlyRevenue: number;
  currentProfitOrLoss: number;
  bepProgressPercent: number;
} {
  const totalVolume = menus.reduce((sum, m) => sum + m.salesVolume, 0);

  if (totalVolume === 0) {
    return {
      totalFixedCost: monthlyFixedCost,
      weightedContributionMargin: 0,
      totalMonthlyPortionsBEP: 0,
      totalRevenueBEP: 0,
      currentMonthlyPortions: 0,
      currentMonthlyRevenue: 0,
      currentProfitOrLoss: -monthlyFixedCost,
      bepProgressPercent: 0,
    };
  }

  let totalWeightedMargin = 0;
  let currentMonthlyRevenue = 0;
  let totalVariableCost = 0;

  for (const menu of menus) {
    const contributionMargin = menu.sellingPrice - menu.totalHPP;
    const weight = menu.salesVolume / totalVolume;
    totalWeightedMargin += contributionMargin * weight;

    currentMonthlyRevenue += menu.sellingPrice * menu.salesVolume;
    totalVariableCost += menu.totalHPP * menu.salesVolume;
  }

  const safeMargin = Math.max(1, totalWeightedMargin);
  const totalMonthlyPortionsBEP = Math.ceil(monthlyFixedCost / safeMargin);

  const averageSellingPrice = currentMonthlyRevenue / totalVolume;
  const totalRevenueBEP = totalMonthlyPortionsBEP * averageSellingPrice;

  const currentProfitOrLoss = currentMonthlyRevenue - totalVariableCost - monthlyFixedCost;
  const bepProgressPercent =
    totalMonthlyPortionsBEP > 0
      ? Math.min(200, (totalVolume / totalMonthlyPortionsBEP) * 100)
      : 0;

  return {
    totalFixedCost: monthlyFixedCost,
    weightedContributionMargin: totalWeightedMargin,
    totalMonthlyPortionsBEP,
    totalRevenueBEP,
    currentMonthlyPortions: totalVolume,
    currentMonthlyRevenue,
    currentProfitOrLoss,
    bepProgressPercent,
  };
}

/**
 * Single-product or weighted average Break-Even Point calculation
 */
export function calculateBreakEvenPoint(
  fixedCost: number,
  averagePrice: number,
  averageHPP: number
): {
  bepUnits: number;
  bepRevenue: number;
  contributionMargin: number;
  contributionMarginRatio: number;
} {
  const contributionMargin = Math.max(1, averagePrice - averageHPP);
  const contributionMarginRatio = averagePrice > 0 ? contributionMargin / averagePrice : 0;
  const bepUnits = Math.ceil(fixedCost / contributionMargin);
  const bepRevenue = bepUnits * averagePrice;

  return {
    bepUnits,
    bepRevenue,
    contributionMargin,
    contributionMarginRatio,
  };
}

/**
 * Suggest recommended selling price based on HPP and target Food Cost %
 */
export function suggestSellingPrice(hpp: number, targetFoodCostPercent: number): number {
  if (targetFoodCostPercent <= 0) return hpp;
  const rawPrice = (hpp / targetFoodCostPercent) * 100;
  // Round up to nearest 500 IDR
  return Math.ceil(rawPrice / 500) * 500;
}

/**
 * Calculate markup price for online food delivery to hit target net margin
 */
export function calculateMarkupPriceForTargetMargin(
  totalOnlineHPP: number,
  targetMarginPercent: number,
  commissionPercent: number = 20,
  flatFee: number = 1000,
  promoPercent: number = 0
): number {
  const retention = 1 - (commissionPercent + promoPercent) / 100;
  const marginFactor = 1 - targetMarginPercent / 100;
  if (retention <= 0 || marginFactor <= 0) return totalOnlineHPP * 1.5;

  const raw = (totalOnlineHPP + flatFee) / (retention * marginFactor);
  return Math.ceil(raw / 500) * 500;
}

/**
 * Return CSS color text class according to Food Cost health threshold
 * < 30%: Sehat (Green)
 * 30% - 35%: Waspada (Yellow)
 * > 35%: Kritis (Red)
 */
export function getFoodCostColorClass(foodCostPercent: number): string {
  if (foodCostPercent <= 30) return "text-emerald-700";
  if (foodCostPercent <= 35) return "text-amber-600";
  return "text-rose-600";
}

/**
 * Return badge variant according to Food Cost health threshold
 */
export function getFoodCostBadgeVariant(foodCostPercent: number): "default" | "secondary" | "destructive" | "outline" {
  if (foodCostPercent <= 30) return "default";
  if (foodCostPercent <= 35) return "secondary";
  return "destructive";
}

/**
 * Calculate Actual COGS from stock opname
 */
export function calculateActualCOGS(beginningStock: number, purchases: number, endingStock: number, unitCost: number): number {
  const usage = Math.max(0, beginningStock + purchases - endingStock);
  return usage * unitCost;
}

/**
 * Calculate COGS variance between actual and theoretical
 */
export function calculateCOGSVariance(actualCOGS: number, theoreticalCOGS: number): {
  varianceAmount: number;
  variancePercent: number;
  isLeakage: boolean;
} {
  const varianceAmount = actualCOGS - theoreticalCOGS;
  const variancePercent = theoreticalCOGS > 0 ? (varianceAmount / theoreticalCOGS) * 100 : 0;
  return {
    varianceAmount,
    variancePercent,
    isLeakage: varianceAmount > 0,
  };
}

