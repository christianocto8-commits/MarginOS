import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Memulai seeding data DapurMetric (3 Jenis Layanan F&B)...");

  // Bersihkan data lama jika ada
  await prisma.inventoryLog.deleteMany();
  await prisma.inventoryPeriod.deleteMany();
  await prisma.menuRecipeItem.deleteMany();
  await prisma.menu.deleteMany();
  await prisma.subRecipeItem.deleteMany();
  await prisma.subRecipe.deleteMany();
  await prisma.ingredientPriceHistory.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.outlet.deleteMany();

  // -------------------------------------------------------------
  // 1. OUTLET 1: COFFEE SHOP (Kopi Titik Temu Senopati)
  // -------------------------------------------------------------
  const coffeeOutlet = await prisma.outlet.create({
    data: {
      name: "Titik Temu Coffee Artisan",
      code: "TT-SENO",
      category: "Coffee Shop",
      address: "Jl. Senopati No. 42, Kebayoran Baru, Jakarta Selatan",
      phone: "0812-8899-7711",
      targetFoodCostPercent: 28.0,
      monthlyFixedCost: 22000000, // Sewa 12jt, Barista 8jt, Listrik/WiFi 2jt
    },
  });

  // Ingredients Coffee Shop
  const coffeeBeans = await prisma.ingredient.create({
    data: {
      outletId: coffeeOutlet.id,
      name: "Biji Kopi Arabica Gayo Fullwash",
      sku: "ING-COF-01",
      category: "Coffee Beans",
      supplier: "Gayo Mountain Specialty Roastery",
      purchasePrice: 240000, // Rp 240.000 per kg
      packageSize: 1000,
      purchaseUnit: "gr",
      yieldPercent: 98.0, // 2% loss saat purge grinder
      currentStock: 15000, // 15 kg
      minStockAlert: 5000,
      priceHistory: {
        create: [
          {
            price: 220000,
            packageSize: 1000,
            purchaseUnit: "gr",
            changePercent: 0,
            notes: "Harga kontrak awal",
          },
          {
            price: 240000,
            packageSize: 1000,
            purchaseUnit: "gr",
            changePercent: 9.09,
            notes: "Kenaikan harga panen petani Gayo",
          },
        ],
      },
    },
  });

  const freshMilk = await prisma.ingredient.create({
    data: {
      outletId: coffeeOutlet.id,
      name: "Susu Segar UHT Diamond Barista",
      sku: "ING-DAI-01",
      category: "Dairy",
      supplier: "PT Diamond Cold Storage",
      purchasePrice: 19500, // Rp 19.500 per liter
      packageSize: 1000,
      purchaseUnit: "ml",
      yieldPercent: 96.0, // 4% milk steaming waste
      currentStock: 60000, // 60 Liter
      minStockAlert: 20000,
      priceHistory: {
        create: [
          {
            price: 18500,
            packageSize: 1000,
            purchaseUnit: "ml",
            changePercent: 0,
            notes: "Harga promo supplier",
          },
          {
            price: 19500,
            packageSize: 1000,
            purchaseUnit: "ml",
            changePercent: 5.4,
            notes: "Penyesuaian BBM distribusi",
          },
        ],
      },
    },
  });

  const gulaAren = await prisma.ingredient.create({
    data: {
      outletId: coffeeOutlet.id,
      name: "Gula Aren Batok Organik Lebak",
      sku: "ING-DRY-01",
      category: "Dry Goods",
      supplier: "Kelompok Tani Baduy",
      purchasePrice: 42000,
      packageSize: 1000,
      purchaseUnit: "gr",
      yieldPercent: 95.0,
      currentStock: 25000,
    },
  });

  const airMineral = await prisma.ingredient.create({
    data: {
      outletId: coffeeOutlet.id,
      name: "Air Mineral Filter Reverse Osmosis",
      sku: "ING-BEV-01",
      category: "Beverage",
      supplier: "Internal RO System",
      purchasePrice: 20000,
      packageSize: 19000,
      purchaseUnit: "ml",
      yieldPercent: 100.0,
      currentStock: 95000,
    },
  });

  const daunPandan = await prisma.ingredient.create({
    data: {
      outletId: coffeeOutlet.id,
      name: "Daun Pandan Wangi Segar",
      sku: "ING-PROD-01",
      category: "Produce",
      supplier: "Pasar Induk Kramat Jati",
      purchasePrice: 15000,
      packageSize: 500,
      purchaseUnit: "gr",
      yieldPercent: 85.0, // Batang & ujung dibuang
      currentStock: 2000,
    },
  });

  const esBatu = await prisma.ingredient.create({
    data: {
      outletId: coffeeOutlet.id,
      name: "Es Batu Tube Kristal Higienis",
      sku: "ING-OTH-01",
      category: "Other",
      supplier: "Pabrik Es Mandiri",
      purchasePrice: 15000,
      packageSize: 10000,
      purchaseUnit: "gr",
      yieldPercent: 92.0, // Meleleh
      currentStock: 40000,
    },
  });

  // Packaging Coffee Shop
  const cup16oz = await prisma.ingredient.create({
    data: {
      outletId: coffeeOutlet.id,
      name: "Cup PP Injection 16oz Custom Print",
      sku: "PKG-CUP-16",
      category: "Packaging",
      supplier: "Mitra Kemasan Utama",
      purchasePrice: 27500,
      packageSize: 50,
      purchaseUnit: "pcs",
      isPackaging: true,
      currentStock: 1000,
    },
  });

  const lidStrawless = await prisma.ingredient.create({
    data: {
      outletId: coffeeOutlet.id,
      name: "Lid Strawless Frost Sip",
      sku: "PKG-LID-01",
      category: "Packaging",
      supplier: "Mitra Kemasan Utama",
      purchasePrice: 12500,
      packageSize: 50,
      purchaseUnit: "pcs",
      isPackaging: true,
      currentStock: 1000,
    },
  });

  const paperStraw = await prisma.ingredient.create({
    data: {
      outletId: coffeeOutlet.id,
      name: "Sedotan Kertas Ramah Lingkungan",
      sku: "PKG-STR-01",
      category: "Packaging",
      supplier: "Eco Packaging ID",
      purchasePrice: 18000,
      packageSize: 100,
      purchaseUnit: "pcs",
      isPackaging: true,
      currentStock: 1500,
    },
  });

  const paperBag = await prisma.ingredient.create({
    data: {
      outletId: coffeeOutlet.id,
      name: "Paper Bag Kraft Brown Medium (1-2 Cup)",
      sku: "PKG-BAG-01",
      category: "Packaging",
      supplier: "Eco Packaging ID",
      purchasePrice: 35000,
      packageSize: 50,
      purchaseUnit: "pcs",
      isPackaging: true,
      currentStock: 500,
    },
  });

  // SubRecipe Coffee Shop: House Aren Syrup
  const houseArenSyrup = await prisma.subRecipe.create({
    data: {
      outletId: coffeeOutlet.id,
      name: "House Blend Aren Syrup Pandan",
      category: "Syrup/Sauce",
      description: "Sirup gula aren khas dengan rebusan daun pandan wangi untuk racikan signature latte",
      batchYield: 1200, // 1200 ml jadi
      batchUnit: "ml",
      shelfLifeDays: 14,
      storageMethod: "Chiller (4°C)",
      directLaborCost: 5000, // Waktu barista masak 30 menit
      overheadCost: 3000, // Gas & listrik
      items: {
        create: [
          {
            ingredientId: gulaAren.id,
            quantity: 1000,
            unit: "gr",
            notes: "Dicacah halus sebelum direbus",
          },
          {
            ingredientId: airMineral.id,
            quantity: 400,
            unit: "ml",
          },
          {
            ingredientId: daunPandan.id,
            quantity: 50,
            unit: "gr",
            notes: "Dicuci bersih dan disimpul",
          },
        ],
      },
    },
  });

  // Menu Coffee Shop: Es Kopi Susu Aren Signature
  await prisma.menu.create({
    data: {
      outletId: coffeeOutlet.id,
      name: "Es Kopi Susu Gula Aren",
      sku: "MENU-COF-01",
      category: "Beverage",
      description: "Double shot espresso blend Gayo, fresh milk creamy, dan sirup aren pandan alami",
      sellingPriceDineIn: 25000,
      sellingPriceOnline: 32000,
      monthlySalesVolume: 720,
      wastePercent: 2.0,
      directLaborCost: 1500,
      targetFoodCostPercent: 28.0,
      onlinePlatformCommissionPercent: 20.0,
      onlinePlatformFlatFee: 1000,
      merchantPromoSharePercent: 5.0,
      recipeItems: {
        create: [
          {
            ingredientId: coffeeBeans.id,
            itemType: "ingredient",
            quantity: 18, // 18 gr beans -> 36 gr espresso
            unit: "gr",
            channel: "all",
          },
          {
            ingredientId: freshMilk.id,
            itemType: "ingredient",
            quantity: 120,
            unit: "ml",
            channel: "all",
          },
          {
            subRecipeId: houseArenSyrup.id,
            itemType: "sub_recipe",
            quantity: 25,
            unit: "ml",
            channel: "all",
          },
          {
            ingredientId: esBatu.id,
            itemType: "ingredient",
            quantity: 130,
            unit: "gr",
            channel: "all",
          },
          // Packaging Takeaway/Online
          {
            ingredientId: cup16oz.id,
            itemType: "ingredient",
            quantity: 1,
            unit: "pcs",
            channel: "online_only",
          },
          {
            ingredientId: lidStrawless.id,
            itemType: "ingredient",
            quantity: 1,
            unit: "pcs",
            channel: "online_only",
          },
          {
            ingredientId: paperStraw.id,
            itemType: "ingredient",
            quantity: 1,
            unit: "pcs",
            channel: "online_only",
          },
          {
            ingredientId: paperBag.id,
            itemType: "ingredient",
            quantity: 0.5, // 1 bag muat 2 cup rata-rata
            unit: "pcs",
            channel: "online_only",
          },
        ],
      },
    },
  });

  // Menu 2 Coffee Shop: Americano Double Shot
  await prisma.menu.create({
    data: {
      outletId: coffeeOutlet.id,
      name: "Iced Americano Reserve",
      sku: "MENU-COF-02",
      category: "Beverage",
      description: "Double shot espresso ekstraksi lambat dengan air mineral dingin dan es kristal",
      sellingPriceDineIn: 22000,
      sellingPriceOnline: 28000,
      monthlySalesVolume: 410,
      wastePercent: 1.5,
      directLaborCost: 1000,
      targetFoodCostPercent: 20.0,
      recipeItems: {
        create: [
          {
            ingredientId: coffeeBeans.id,
            itemType: "ingredient",
            quantity: 18,
            unit: "gr",
            channel: "all",
          },
          {
            ingredientId: airMineral.id,
            itemType: "ingredient",
            quantity: 160,
            unit: "ml",
            channel: "all",
          },
          {
            ingredientId: esBatu.id,
            itemType: "ingredient",
            quantity: 120,
            unit: "gr",
            channel: "all",
          },
          {
            ingredientId: cup16oz.id,
            itemType: "ingredient",
            quantity: 1,
            unit: "pcs",
            channel: "online_only",
          },
          {
            ingredientId: lidStrawless.id,
            itemType: "ingredient",
            quantity: 1,
            unit: "pcs",
            channel: "online_only",
          },
        ],
      },
    },
  });

  // -------------------------------------------------------------
  // 2. OUTLET 2: RESTORAN (Rasa Nusantara Kitchen & Grill)
  // -------------------------------------------------------------
  const restoOutlet = await prisma.outlet.create({
    data: {
      name: "Rasa Nusantara Kitchen & Grill",
      code: "RN-GAND",
      category: "Restaurant",
      address: "Gandaria City Mall Lantai UG, Jakarta Selatan",
      phone: "0811-3322-4455",
      targetFoodCostPercent: 32.0,
      monthlyFixedCost: 38000000, // Sewa mall 25jt, Koki & Pelayan 10jt, Service charge 3jt
    },
  });

  const ayamFillet = await prisma.ingredient.create({
    data: {
      outletId: restoOutlet.id,
      name: "Dada Ayam Fillet Boneless Skinless",
      sku: "ING-PROT-01",
      category: "Protein",
      supplier: "CV Unggas Jaya Sentosa",
      purchasePrice: 52000, // Rp 52.000 / kg
      packageSize: 1000,
      purchaseUnit: "gr",
      yieldPercent: 82.0, // Trimming lemak dan air susut 18%
      currentStock: 35000,
      priceHistory: {
        create: [
          {
            price: 47000,
            packageSize: 1000,
            purchaseUnit: "gr",
            changePercent: 0,
            notes: "Harga awal bulan lalu",
          },
          {
            price: 52000,
            packageSize: 1000,
            purchaseUnit: "gr",
            changePercent: 10.64,
            notes: "Lonjakan harga pakan jagung ternak",
          },
        ],
      },
    },
  });

  const berasRamos = await prisma.ingredient.create({
    data: {
      outletId: restoOutlet.id,
      name: "Beras Pandan Wangi Premium Setra Ramos",
      sku: "ING-DRY-02",
      category: "Dry Goods",
      supplier: "Distributor Beras Cipinang",
      purchasePrice: 385000,
      packageSize: 25000, // 25 kg
      purchaseUnit: "gr",
      yieldPercent: 240.0, // Beras masak jadi nasi mengembang 2.4x
      currentStock: 75000,
    },
  });

  const telurAyam = await prisma.ingredient.create({
    data: {
      outletId: restoOutlet.id,
      name: "Telur Ayam Ras Segar Peternak",
      sku: "ING-PROT-02",
      category: "Protein",
      supplier: "Peternakan Berkah Blitar",
      purchasePrice: 32000, // Rp 32.000 / kg (isi 16 butir)
      packageSize: 16,
      purchaseUnit: "butir",
      yieldPercent: 88.0, // Kulit telur 12%
      currentStock: 240,
    },
  });

  const minyakGoreng = await prisma.ingredient.create({
    data: {
      outletId: restoOutlet.id,
      name: "Minyak Goreng Sawit Kelapa Filma",
      sku: "ING-DRY-03",
      category: "Dry Goods",
      supplier: "Grosir Sembako Rezeki",
      purchasePrice: 42000,
      packageSize: 2000, // 2 Liter
      purchaseUnit: "ml",
      yieldPercent: 90.0, // Susut serap wajan
      currentStock: 20000,
    },
  });

  const bentoBox = await prisma.ingredient.create({
    data: {
      outletId: restoOutlet.id,
      name: "Bento Box Bento Meal 4 Sekat Microwavable",
      sku: "PKG-BOX-04",
      category: "Packaging",
      supplier: "Mitra Kemasan Utama",
      purchasePrice: 85000,
      packageSize: 50,
      purchaseUnit: "pcs",
      isPackaging: true,
      currentStock: 400,
    },
  });

  const cutlerySet = await prisma.ingredient.create({
    data: {
      outletId: restoOutlet.id,
      name: "Set Sendok Garpu Tissue Higienis Seal",
      sku: "PKG-CUT-01",
      category: "Packaging",
      supplier: "Mitra Kemasan Utama",
      purchasePrice: 48000,
      packageSize: 100,
      purchaseUnit: "pcs",
      isPackaging: true,
      currentStock: 800,
    },
  });

  // SubRecipe Restoran: Bumbu Nasi Goreng Spesial
  const bumbuNasiGoreng = await prisma.subRecipe.create({
    data: {
      outletId: restoOutlet.id,
      name: "Bumbu Dasar Merah Nasi Goreng Nusantara",
      category: "Syrup/Sauce",
      description: "Pasta bumbu tumis bawang merah, bawang putih, cabai terasi, dan rempah sangrai",
      batchYield: 1500, // 1500 gr
      batchUnit: "gr",
      shelfLifeDays: 10,
      storageMethod: "Chiller (2-5°C)",
      directLaborCost: 8000,
      overheadCost: 4000,
      items: {
        create: [
          {
            ingredientId: minyakGoreng.id,
            quantity: 300,
            unit: "ml",
          },
        ],
      },
    },
  });

  // Menu Restoran: Nasi Goreng Spesial Ayam
  await prisma.menu.create({
    data: {
      outletId: restoOutlet.id,
      name: "Nasi Goreng Spesial Ayam Suwir & Telur",
      sku: "MENU-RES-01",
      category: "Main Course",
      description: "Nasi pulen bumbu rempah Nusantara dengan suwiran ayam gurih, telur mata sapi, acar segar, dan kerupuk",
      sellingPriceDineIn: 45000,
      sellingPriceOnline: 56000,
      monthlySalesVolume: 560,
      wastePercent: 3.0,
      directLaborCost: 3500,
      targetFoodCostPercent: 30.0,
      onlinePlatformCommissionPercent: 20.0,
      onlinePlatformFlatFee: 1000,
      merchantPromoSharePercent: 5.0,
      recipeItems: {
        create: [
          {
            ingredientId: berasRamos.id,
            itemType: "ingredient",
            quantity: 110, // 110 gr beras mentah jadi ~260 gr nasi masak
            unit: "gr",
            channel: "all",
          },
          {
            ingredientId: ayamFillet.id,
            itemType: "ingredient",
            quantity: 75,
            unit: "gr",
            channel: "all",
          },
          {
            ingredientId: telurAyam.id,
            itemType: "ingredient",
            quantity: 1,
            unit: "butir",
            channel: "all",
          },
          {
            subRecipeId: bumbuNasiGoreng.id,
            itemType: "sub_recipe",
            quantity: 40,
            unit: "gr",
            channel: "all",
          },
          {
            ingredientId: minyakGoreng.id,
            itemType: "ingredient",
            quantity: 25,
            unit: "ml",
            channel: "all",
          },
          {
            ingredientId: bentoBox.id,
            itemType: "ingredient",
            quantity: 1,
            unit: "pcs",
            channel: "online_only",
          },
          {
            ingredientId: cutlerySet.id,
            itemType: "ingredient",
            quantity: 1,
            unit: "pcs",
            channel: "online_only",
          },
        ],
      },
    },
  });

  // -------------------------------------------------------------
  // 3. OUTLET 3: BAKERY (Artisan Flour & Crust Boulangerie)
  // -------------------------------------------------------------
  const bakeryOutlet = await prisma.outlet.create({
    data: {
      name: "Artisan Flour & Crust Bakery",
      code: "FC-DHAR",
      category: "Bakery",
      address: "Jl. Dharmawangsa X No. 18, Jakarta Selatan",
      phone: "0819-7755-2233",
      targetFoodCostPercent: 26.0,
      monthlyFixedCost: 26000000, // Sewa 14jt, Baker 9jt, Listrik oven 3jt
    },
  });

  const tepungTerigu = await prisma.ingredient.create({
    data: {
      outletId: bakeryOutlet.id,
      name: "Tepung Terigu Protein Tinggi Cakra Kembar Emas",
      sku: "ING-DRY-04",
      category: "Dry Goods",
      supplier: "Bogasari Flour Mills",
      purchasePrice: 298000,
      packageSize: 25000,
      purchaseUnit: "gr",
      yieldPercent: 100.0,
      currentStock: 100000,
    },
  });

  const dryButter = await prisma.ingredient.create({
    data: {
      outletId: bakeryOutlet.id,
      name: "Elle & Vire Sheet Butter 84% Fat (Croissant)",
      sku: "ING-DAI-02",
      category: "Dairy",
      supplier: "Sukanda Djaya International",
      purchasePrice: 175000,
      packageSize: 1000,
      purchaseUnit: "gr",
      yieldPercent: 98.0,
      currentStock: 12000,
      priceHistory: {
        create: [
          {
            price: 160000,
            packageSize: 1000,
            purchaseUnit: "gr",
            changePercent: 0,
            notes: "Harga impor Prancis kuartal lalu",
          },
          {
            price: 175000,
            packageSize: 1000,
            purchaseUnit: "gr",
            changePercent: 9.38,
            notes: "Fluktuasi nilai tukar Euro & logistik",
          },
        ],
      },
    },
  });

  const ragiInstan = await prisma.ingredient.create({
    data: {
      outletId: bakeryOutlet.id,
      name: "Ragi Roti Kering Saf-Instant Gold",
      sku: "ING-DRY-05",
      category: "Dry Goods",
      supplier: "Lesaffre Indonesia",
      purchasePrice: 52000,
      packageSize: 500,
      purchaseUnit: "gr",
      yieldPercent: 100.0,
      currentStock: 2500,
    },
  });

  const boxCroissant = await prisma.ingredient.create({
    data: {
      outletId: bakeryOutlet.id,
      name: "Kotak Bakery Kraft Window Food Grade",
      sku: "PKG-BOX-01",
      category: "Packaging",
      supplier: "Mitra Kemasan Utama",
      purchasePrice: 75000,
      packageSize: 50,
      purchaseUnit: "pcs",
      isPackaging: true,
      currentStock: 600,
    },
  });

  // SubRecipe Bakery: Adonan Dasar Croissant
  const adonanCroissant = await prisma.subRecipe.create({
    data: {
      outletId: bakeryOutlet.id,
      name: "Adonan Dasar Laminasi Croissant 24 Layer",
      category: "Dough/Pastry",
      description: "Adonan fermentasi dingin 18 jam dengan laminasi French sheet butter",
      batchYield: 24, // Menghasilkan 24 pcs adonan siap bake
      batchUnit: "pcs",
      shelfLifeDays: 3,
      storageMethod: "Freezer (-18°C)",
      directLaborCost: 20000, // Pengerjaan baker laminasi
      overheadCost: 10000, // Proofer & pendingin
      items: {
        create: [
          {
            ingredientId: tepungTerigu.id,
            quantity: 1000,
            unit: "gr",
          },
          {
            ingredientId: dryButter.id,
            quantity: 500,
            unit: "gr",
          },
          {
            ingredientId: ragiInstan.id,
            quantity: 15,
            unit: "gr",
          },
        ],
      },
    },
  });

  // Menu Bakery: Butter Croissant Classic
  await prisma.menu.create({
    data: {
      outletId: bakeryOutlet.id,
      name: "French Butter Croissant Classic",
      sku: "MENU-BAK-01",
      category: "Pastry & Bakery",
      description: "Croissant renyah berlapis dengan aroma butter Prancis 84% fat yang wangi karamel",
      sellingPriceDineIn: 28000,
      sellingPriceOnline: 35000,
      monthlySalesVolume: 850,
      wastePercent: 2.5,
      directLaborCost: 2000,
      targetFoodCostPercent: 25.0,
      onlinePlatformCommissionPercent: 20.0,
      onlinePlatformFlatFee: 1000,
      merchantPromoSharePercent: 0.0,
      recipeItems: {
        create: [
          {
            subRecipeId: adonanCroissant.id,
            itemType: "sub_recipe",
            quantity: 1,
            unit: "pcs",
            channel: "all",
          },
          {
            ingredientId: boxCroissant.id,
            itemType: "ingredient",
            quantity: 1,
            unit: "pcs",
            channel: "online_only",
          },
        ],
      },
    },
  });

  // -------------------------------------------------------------
  // 4. STOCK OPNAME / INVENTORY PERIOD SEEDING (Untuk Analisis Varians)
  // -------------------------------------------------------------
  const octPeriod = await prisma.inventoryPeriod.create({
    data: {
      outletId: coffeeOutlet.id,
      periodName: "Periode Oktober 2026",
      startDate: new Date("2026-10-01T00:00:00.000Z"),
      endDate: new Date("2026-10-31T23:59:59.000Z"),
      status: "closed",
      totalRevenue: 34500000,
      theoreticalCOGS: 9660000, // 28% dari omzet
      actualCOGS: 10420000, // Selisih karena ada susu asam tumpah & beans waste
      varianceAmount: 760000, // Kerugian Rp 760.000
      variancePercent: 7.87,
      notes: "Audit bulanan: Ditemukan kebocoran stok pada susu UHT (kulkas rusak 1 hari) dan sisa bubuk kopi tercecer di meja bar",
      logs: {
        create: [
          {
            ingredientId: coffeeBeans.id,
            beginningStock: 5000,
            purchases: 20000,
            endingStock: 8200,
            unitCost: 240,
            theoreticalUsage: 16200,
            actualUsage: 16800,
            varianceQty: 600, // Susut 600gr
            varianceCost: 144000,
            notes: "Kalibrasi grinder dial-in harian",
          },
          {
            ingredientId: freshMilk.id,
            beginningStock: 15000,
            purchases: 120000,
            endingStock: 18000,
            unitCost: 19.5,
            theoreticalUsage: 111000,
            actualUsage: 117000,
            varianceQty: 6000, // Selisih 6 liter
            varianceCost: 117000,
            notes: "Susu pecah karena chiller sempat naik ke 10°C",
          },
        ],
      },
    },
  });

  console.log("✅ Seeding DapurMetric berhasil!");
  console.log(`- Outlet Terdaftar: 3 (Coffee Shop, Restaurant, Bakery)`);
  console.log(`- Sub-Recipe & Formula: House Aren Syrup, Bumbu Dasar, Adonan Croissant`);
  console.log(`- Menu Lengkap: Es Kopi Susu Aren, Americano, Nasi Goreng Spesial, Butter Croissant`);
  console.log(`- Riwayat Harga & Audit Periode Stok Opname: Siap digunakan`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
