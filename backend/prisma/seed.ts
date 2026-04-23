import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Food Controller database...');

  // ── Organization ──
  const org = await prisma.organization.upsert({
    where: { slug: 'the-golden-wok' },
    update: {},
    create: {
      name: 'The Golden Wok Restaurant',
      slug: 'the-golden-wok',
      type: 'restaurant',
      taxId: '0105560123456',
      address: '123 Sukhumvit Rd, Watthana, Bangkok 10110',
      phone: '02-123-4567',
      mobile: '081-234-5678',
      email: 'info@goldenwok.co.th',
      website: 'www.goldenwok.co.th',
      language: 'en',
      timezone: 'Asia/Bangkok',
      currency: 'THB',
      operationStartDate: new Date('2020-01-15'),
    },
  });

  // ── Owner User ──
  const passwordHash = await bcrypt.hash('Admin1234!', 12);
  const owner = await prisma.user.upsert({
    where: { email: 'owner@goldenwok.co.th' },
    update: {},
    create: {
      email: 'owner@goldenwok.co.th',
      passwordHash,
      firstName: 'Somchai',
      lastName: 'Jaidee',
      phone: '081-111-2222',
      emailVerified: true,
    },
  });

  await prisma.userOrganization.upsert({
    where: { userId_organizationId: { userId: owner.id, organizationId: org.id } },
    update: {},
    create: { userId: owner.id, organizationId: org.id, role: 'OWNER', position: 'Owner', joinedAt: new Date() },
  });

  // ── Manager User ──
  const manager = await prisma.user.upsert({
    where: { email: 'manager@goldenwok.co.th' },
    update: {},
    create: {
      email: 'manager@goldenwok.co.th',
      passwordHash: await bcrypt.hash('Manager1234!', 12),
      firstName: 'Napat',
      lastName: 'Wongsiri',
      emailVerified: true,
    },
  });
  await prisma.userOrganization.upsert({
    where: { userId_organizationId: { userId: manager.id, organizationId: org.id } },
    update: {},
    create: { userId: manager.id, organizationId: org.id, role: 'MANAGER', position: 'Restaurant Manager', joinedAt: new Date() },
  });

  // ── Staff User ──
  const staff = await prisma.user.upsert({
    where: { email: 'staff@goldenwok.co.th' },
    update: {},
    create: {
      email: 'staff@goldenwok.co.th',
      passwordHash: await bcrypt.hash('Staff1234!', 12),
      firstName: 'Ploy',
      lastName: 'Charoensuk',
      emailVerified: true,
    },
  });
  await prisma.userOrganization.upsert({
    where: { userId_organizationId: { userId: staff.id, organizationId: org.id } },
    update: {},
    create: { userId: staff.id, organizationId: org.id, role: 'STAFF', position: 'Chef de Partie', joinedAt: new Date() },
  });

  // ── Suppliers ──
  const suppliers = await Promise.all([
    prisma.supplier.upsert({ where: { organizationId_code: { organizationId: org.id, code: 'SUP001' } }, update: {}, create: { organizationId: org.id, code: 'SUP001', name: 'CPF (Thailand) PCL', taxId: '0107537000475', address: '313 CP Tower, Silom, Bangkok', creditDays: 30, contactName: 'Kamon T.', mobile: '081-333-4444', email: 'sales@cpf.co.th', bankName: 'Bangkok Bank', bankAccount: '123-456-7890', bankBranch: 'Silom' } }),
    prisma.supplier.upsert({ where: { organizationId_code: { organizationId: org.id, code: 'SUP002' } }, update: {}, create: { organizationId: org.id, code: 'SUP002', name: 'Siam Makro PCL', taxId: '0107537000123', address: '1468 Phatthanakan Rd, Bangkok', creditDays: 7, contactName: 'Jiraporn S.', mobile: '082-555-6666', email: 'b2b@makro.co.th', bankName: 'Kasikorn Bank', bankAccount: '098-7654-321', bankBranch: 'Phatthanakan' } }),
    prisma.supplier.upsert({ where: { organizationId_code: { organizationId: org.id, code: 'SUP003' } }, update: {}, create: { organizationId: org.id, code: 'SUP003', name: 'Siam Foods Co., Ltd.', taxId: '0105550012345', address: '45 Rama IV Rd, Bangkok', creditDays: 14, contactName: 'Pranya W.', mobile: '083-777-8888', email: 'info@siamfoods.co.th', bankName: 'SCB', bankAccount: '111-222-3333', bankBranch: 'Rama IV' } }),
    prisma.supplier.upsert({ where: { organizationId_code: { organizationId: org.id, code: 'SUP004' } }, update: {}, create: { organizationId: org.id, code: 'SUP004', name: 'Thai Namthip Co., Ltd.', taxId: '0107560065432', address: '88 Charansanitwong, Bangkok', creditDays: 30, contactName: 'Wichai L.', mobile: '084-999-0000', email: 'sales@namthip.co.th', bankName: 'TMB Bank', bankAccount: '444-555-6666', bankBranch: 'Charansanitwong' } }),
  ]);

  // ── Ingredients ──
  const ingredientData = [
    { code: 'ING001', name: 'Chicken Breast', brand: 'CPF', foodCategory: 'Protein', purchaseWeight: 1000, purchaseUnit: 'g', purchasePrice: 85, lossPercentage: 5, supplierId: suppliers[0].id, caloriesPer100g: 165, proteinPer100g: 31, fatPer100g: 3.6, carbsPer100g: 0 },
    { code: 'ING002', name: 'Pork Tenderloin', brand: 'CPF', foodCategory: 'Protein', purchaseWeight: 1000, purchaseUnit: 'g', purchasePrice: 120, lossPercentage: 8, supplierId: suppliers[0].id, caloriesPer100g: 143, proteinPer100g: 21, fatPer100g: 3.5, carbsPer100g: 0 },
    { code: 'ING003', name: 'Sea Bass Fillet', brand: 'Siam Foods', foodCategory: 'Seafood', purchaseWeight: 1000, purchaseUnit: 'g', purchasePrice: 280, lossPercentage: 12, supplierId: suppliers[2].id, caloriesPer100g: 97, proteinPer100g: 18.4, fatPer100g: 2, carbsPer100g: 0 },
    { code: 'ING004', name: 'Shrimp 70/90', brand: 'CPF', foodCategory: 'Seafood', purchaseWeight: 1000, purchaseUnit: 'g', purchasePrice: 210, lossPercentage: 15, supplierId: suppliers[0].id, caloriesPer100g: 85, proteinPer100g: 18, fatPer100g: 0.9, carbsPer100g: 0.2 },
    { code: 'ING005', name: 'White Sugar', brand: 'Mitr Phol', foodCategory: 'Seasoning', purchaseWeight: 1000, purchaseUnit: 'g', purchasePrice: 23, lossPercentage: 0, supplierId: suppliers[1].id, caloriesPer100g: 387, proteinPer100g: 0, fatPer100g: 0, carbsPer100g: 100 },
    { code: 'ING006', name: 'Fish Sauce', brand: 'Tiparos', foodCategory: 'Seasoning', purchaseWeight: 700, purchaseUnit: 'ml', purchasePrice: 45, lossPercentage: 0, supplierId: suppliers[1].id, caloriesPer100g: 35, proteinPer100g: 5, fatPer100g: 0, carbsPer100g: 4 },
    { code: 'ING007', name: 'Oyster Sauce', brand: 'Maekrua', foodCategory: 'Seasoning', purchaseWeight: 1000, purchaseUnit: 'g', purchasePrice: 65, lossPercentage: 0, supplierId: suppliers[1].id, caloriesPer100g: 51, proteinPer100g: 1.5, fatPer100g: 0.3, carbsPer100g: 10.9 },
    { code: 'ING008', name: 'Garlic', brand: null, foodCategory: 'Vegetable', purchaseWeight: 1000, purchaseUnit: 'g', purchasePrice: 55, lossPercentage: 20, supplierId: suppliers[1].id, caloriesPer100g: 149, proteinPer100g: 6.4, fatPer100g: 0.5, carbsPer100g: 33 },
    { code: 'ING009', name: 'Jasmine Rice', brand: 'Hom Mali', foodCategory: 'Grain', purchaseWeight: 5000, purchaseUnit: 'g', purchasePrice: 120, lossPercentage: 0, supplierId: suppliers[1].id, caloriesPer100g: 365, proteinPer100g: 7, fatPer100g: 0.7, carbsPer100g: 80 },
    { code: 'ING010', name: 'Coconut Milk', brand: 'Chaokoh', foodCategory: 'Dairy Alt', purchaseWeight: 400, purchaseUnit: 'ml', purchasePrice: 28, lossPercentage: 0, supplierId: suppliers[2].id, caloriesPer100g: 197, proteinPer100g: 2.3, fatPer100g: 21, carbsPer100g: 2.8 },
    { code: 'ING011', name: 'Cooking Oil', brand: 'Morakot', foodCategory: 'Fat', purchaseWeight: 1000, purchaseUnit: 'ml', purchasePrice: 68, lossPercentage: 0, supplierId: suppliers[1].id, caloriesPer100g: 884, proteinPer100g: 0, fatPer100g: 100, carbsPer100g: 0 },
    { code: 'ING012', name: 'Lemongrass', brand: null, foodCategory: 'Herb', purchaseWeight: 500, purchaseUnit: 'g', purchasePrice: 35, lossPercentage: 30, supplierId: suppliers[2].id, caloriesPer100g: 99, proteinPer100g: 1.8, fatPer100g: 0.5, carbsPer100g: 25 },
    { code: 'ING013', name: 'Kaffir Lime Leaves', brand: null, foodCategory: 'Herb', purchaseWeight: 200, purchaseUnit: 'g', purchasePrice: 25, lossPercentage: 10, supplierId: suppliers[2].id, caloriesPer100g: 45, proteinPer100g: 1.5, fatPer100g: 0.3, carbsPer100g: 10 },
    { code: 'ING014', name: 'Galangal', brand: null, foodCategory: 'Herb', purchaseWeight: 500, purchaseUnit: 'g', purchasePrice: 40, lossPercentage: 15, supplierId: suppliers[2].id, caloriesPer100g: 70, proteinPer100g: 1, fatPer100g: 0.8, carbsPer100g: 15 },
    { code: 'ING015', name: 'Green Curry Paste', brand: 'Maeploy', foodCategory: 'Paste', purchaseWeight: 400, purchaseUnit: 'g', purchasePrice: 55, lossPercentage: 0, supplierId: suppliers[1].id, caloriesPer100g: 120, proteinPer100g: 3, fatPer100g: 5, carbsPer100g: 15 },
  ];

  const ingredients: any[] = [];
  for (const ing of ingredientData) {
    const pricePerKg = (ing.purchasePrice / ing.purchaseWeight) * 1000;
    const actualCostPerKg = pricePerKg * (1 + ing.lossPercentage / 100);
    const actualCostPerGram = actualCostPerKg / 1000;

    const created = await prisma.ingredient.upsert({
      where: { organizationId_code: { organizationId: org.id, code: ing.code } },
      update: {},
      create: {
        organizationId: org.id,
        supplierId: ing.supplierId,
        code: ing.code,
        name: ing.name,
        brand: ing.brand,
        foodCategory: ing.foodCategory,
        purchaseWeight: ing.purchaseWeight,
        purchaseUnit: ing.purchaseUnit,
        purchasePrice: ing.purchasePrice,
        lossPercentage: ing.lossPercentage,
        pricePerKg,
        actualCostPerGram,
        actualCostPerKg,
        caloriesPer100g: ing.caloriesPer100g,
        proteinPer100g: ing.proteinPer100g,
        fatPer100g: ing.fatPer100g,
        carbsPer100g: ing.carbsPer100g,
      },
    });
    ingredients.push(created);
  }

  const ingMap = Object.fromEntries(ingredients.map((i) => [i.code, i]));

  // ── Recipes ──
  const recipeData = [
    {
      code: 'APP-001', name: 'Tom Yum Soup', category: 'Soup', sellingPrice: 180,
      laborCostPercent: 10, overheadPercent: 15,
      ingredients: [
        { code: 'ING004', quantity: 100 },
        { code: 'ING012', quantity: 20 },
        { code: 'ING013', quantity: 5 },
        { code: 'ING014', quantity: 15 },
        { code: 'ING006', quantity: 20 },
        { code: 'ING005', quantity: 10 },
      ],
    },
    {
      code: 'MAIN-001', name: 'Green Curry Chicken', category: 'Main Course', sellingPrice: 220,
      laborCostPercent: 10, overheadPercent: 15,
      ingredients: [
        { code: 'ING001', quantity: 180 },
        { code: 'ING015', quantity: 50 },
        { code: 'ING010', quantity: 200 },
        { code: 'ING006', quantity: 15 },
        { code: 'ING005', quantity: 15 },
        { code: 'ING013', quantity: 5 },
      ],
    },
    {
      code: 'MAIN-002', name: 'Pork Stir-fry Oyster Sauce', category: 'Main Course', sellingPrice: 160,
      laborCostPercent: 10, overheadPercent: 15,
      ingredients: [
        { code: 'ING002', quantity: 150 },
        { code: 'ING007', quantity: 30 },
        { code: 'ING008', quantity: 15 },
        { code: 'ING011', quantity: 15 },
        { code: 'ING005', quantity: 5 },
      ],
    },
    {
      code: 'MAIN-003', name: 'Pan-fried Sea Bass', category: 'Main Course', sellingPrice: 380,
      laborCostPercent: 12, overheadPercent: 15,
      ingredients: [
        { code: 'ING003', quantity: 200 },
        { code: 'ING011', quantity: 20 },
        { code: 'ING008', quantity: 10 },
        { code: 'ING007', quantity: 20 },
        { code: 'ING006', quantity: 10 },
      ],
    },
    {
      code: 'SIDE-001', name: 'Steamed Jasmine Rice', category: 'Side', sellingPrice: 30,
      laborCostPercent: 5, overheadPercent: 10,
      ingredients: [
        { code: 'ING009', quantity: 150 },
      ],
    },
  ];

  for (const rd of recipeData) {
    const existingRecipe = await prisma.recipe.findFirst({
      where: { organizationId: org.id, code: rd.code },
    });
    if (existingRecipe) continue;

    let totalIngredientCost = 0;
    let totalCalories = 0;
    const ingredientLines = rd.ingredients.map((ri) => {
      const ing = ingMap[ri.code];
      const lineCost = ing.actualCostPerGram * ri.quantity;
      totalIngredientCost += lineCost;
      totalCalories += (ing.caloriesPer100g ?? 0) * (ri.quantity / 100);
      return {
        ingredientId: ing.id,
        quantity: ri.quantity,
        unit: 'g',
        cost: lineCost,
        sortOrder: rd.ingredients.indexOf(ri),
      };
    });

    const multiplier = 1 + (rd.laborCostPercent + rd.overheadPercent) / 100;
    const totalCost = totalIngredientCost * multiplier;
    const grossProfit = rd.sellingPrice - totalCost;
    const grossProfitMargin = (grossProfit / rd.sellingPrice) * 100;
    const foodCostPercent = (totalCost / rd.sellingPrice) * 100;

    await prisma.recipe.create({
      data: {
        organizationId: org.id,
        code: rd.code,
        name: rd.name,
        category: rd.category,
        sellingPrice: rd.sellingPrice,
        laborCostPercent: rd.laborCostPercent,
        overheadPercent: rd.overheadPercent,
        totalIngredientCost,
        totalCost,
        grossProfit,
        grossProfitMargin,
        foodCostPercent,
        totalCalories,
        ingredients: { create: ingredientLines },
      },
    });
  }

  // ── Assets ──
  const assetData = [
    { code: 'EQM-001', name: 'Non-stick Pan 18"', department: 'Kitchen', quantity: 2, unit: 'piece', pricePerUnit: 359, supplierId: suppliers[1].id, purchaseDate: new Date('2022-06-20'), condition: 'GOOD' },
    { code: 'EQM-002', name: 'Stainless Steel Pot', department: 'Kitchen', quantity: 3, unit: 'piece', pricePerUnit: 450, supplierId: suppliers[1].id, purchaseDate: new Date('2022-06-20'), condition: 'GOOD' },
    { code: 'EQM-003', name: 'Chef Knife 9"', department: 'Kitchen', quantity: 3, unit: 'piece', pricePerUnit: 680, supplierId: suppliers[1].id, purchaseDate: new Date('2022-07-01'), condition: 'GOOD' },
    { code: 'EQM-004', name: 'Long Spoon (Guest)', department: 'Service', quantity: 120, unit: 'piece', pricePerUnit: 45, supplierId: suppliers[1].id, purchaseDate: new Date('2022-05-15'), condition: 'GOOD' },
    { code: 'EQM-005', name: 'Long Fork (Guest)', department: 'Service', quantity: 120, unit: 'piece', pricePerUnit: 45, supplierId: suppliers[1].id, purchaseDate: new Date('2022-05-15'), condition: 'GOOD' },
    { code: 'EQM-006', name: 'Water Glass', department: 'Bar', quantity: 150, unit: 'piece', pricePerUnit: 35, supplierId: suppliers[1].id, purchaseDate: new Date('2022-05-15'), condition: 'FAIR' },
    { code: 'EQM-007', name: 'Steak Knife', department: 'Service', quantity: 120, unit: 'piece', pricePerUnit: 85, supplierId: suppliers[1].id, purchaseDate: new Date('2022-05-15'), condition: 'GOOD' },
    { code: 'EQM-008', name: 'Microwave SAMSUNG', department: 'Kitchen', quantity: 2, unit: 'unit', pricePerUnit: 3500, supplierId: suppliers[1].id, purchaseDate: new Date('2022-06-01'), condition: 'EXCELLENT', warrantyExpiry: new Date('2025-06-01') },
    { code: 'EQM-009', name: 'Rice Cooker SHARP', department: 'Kitchen', quantity: 1, unit: 'unit', pricePerUnit: 2200, supplierId: suppliers[1].id, purchaseDate: new Date('2022-06-01'), condition: 'GOOD', warrantyExpiry: new Date('2025-06-01') },
    { code: 'EQM-010', name: '2-Door Fridge SANDEN', department: 'Kitchen', quantity: 1, unit: 'unit', pricePerUnit: 18500, supplierId: suppliers[1].id, purchaseDate: new Date('2022-04-01'), condition: 'GOOD', warrantyExpiry: new Date('2027-04-01') },
  ];

  for (const asset of assetData) {
    await prisma.asset.upsert({
      where: { organizationId_code: { organizationId: org.id, code: asset.code } },
      update: {},
      create: {
        organizationId: org.id,
        supplierId: asset.supplierId,
        code: asset.code,
        name: asset.name,
        department: asset.department,
        quantity: asset.quantity,
        unit: asset.unit,
        pricePerUnit: asset.pricePerUnit,
        totalValue: asset.quantity * asset.pricePerUnit,
        purchaseDate: asset.purchaseDate,
        warrantyExpiry: asset.warrantyExpiry,
        condition: asset.condition as any,
      },
    });
  }

  // ── Financial Records (last 6 months) ──
  const financials = [
    { month: 11, year: 2024, revenue: 285000, foodCost: 71250, beverageCost: 8550, laborCost: 57000, rent: 45000, utilities: 12000, marketing: 5000, maintenance: 3000, depreciation: 2500, otherExpenses: 8000, otherIncome: 5000 },
    { month: 12, year: 2024, revenue: 320000, foodCost: 80000, beverageCost: 9600, laborCost: 64000, rent: 45000, utilities: 13500, marketing: 8000, maintenance: 2000, depreciation: 2500, otherExpenses: 9000, otherIncome: 8000 },
    { month: 1, year: 2025, revenue: 265000, foodCost: 66250, beverageCost: 7950, laborCost: 53000, rent: 45000, utilities: 11000, marketing: 5000, maintenance: 4000, depreciation: 2500, otherExpenses: 7500, otherIncome: 3000 },
    { month: 2, year: 2025, revenue: 278000, foodCost: 69500, beverageCost: 8340, laborCost: 55600, rent: 45000, utilities: 11500, marketing: 5000, maintenance: 2500, depreciation: 2500, otherExpenses: 7800, otherIncome: 4000 },
    { month: 3, year: 2025, revenue: 305000, foodCost: 76250, beverageCost: 9150, laborCost: 61000, rent: 45000, utilities: 12500, marketing: 6000, maintenance: 3500, depreciation: 2500, otherExpenses: 8500, otherIncome: 5000 },
    { month: 4, year: 2025, revenue: 298000, foodCost: 74500, beverageCost: 8940, laborCost: 59600, rent: 45000, utilities: 12000, marketing: 5500, maintenance: 2000, depreciation: 2500, otherExpenses: 8200, otherIncome: 4500 },
  ];

  for (const f of financials) {
    const totalRevenue = f.revenue + f.otherIncome;
    const totalCOGS = f.foodCost + f.beverageCost;
    const grossProfit = totalRevenue - totalCOGS;
    const totalOpEx = f.laborCost + f.rent + f.utilities + f.marketing + f.maintenance + f.depreciation + f.otherExpenses;
    const operatingProfit = grossProfit - totalOpEx;
    const netProfit = operatingProfit;
    const grossMargin = (grossProfit / totalRevenue) * 100;
    const netMargin = (netProfit / totalRevenue) * 100;

    await prisma.financialRecord.upsert({
      where: { organizationId_month_year: { organizationId: org.id, month: f.month, year: f.year } },
      update: {},
      create: {
        organizationId: org.id,
        month: f.month,
        year: f.year,
        revenue: f.revenue,
        otherIncome: f.otherIncome,
        foodCost: f.foodCost,
        beverageCost: f.beverageCost,
        laborCost: f.laborCost,
        rent: f.rent,
        utilities: f.utilities,
        marketing: f.marketing,
        maintenance: f.maintenance,
        depreciation: f.depreciation,
        otherExpenses: f.otherExpenses,
        grossProfit,
        operatingProfit,
        netProfit,
        grossMargin,
        netMargin,
      },
    });
  }

  // ── SOP Document ──
  await prisma.sopDocument.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'SOP-001' } },
    update: {},
    create: {
      organizationId: org.id,
      code: 'SOP-001',
      title: 'Tom Yum Soup - Standard Operating Procedure',
      category: 'Soup',
      version: '1.2',
      content: `# Tom Yum Soup SOP

## Ingredients Preparation
1. Wash and slice lemongrass into 2-inch pieces, bruise with knife
2. Peel and slice galangal thinly
3. Tear kaffir lime leaves in half
4. Clean shrimp, devein, leave tail on

## Cooking Process
1. Bring 400ml water/stock to boil in medium pot
2. Add lemongrass, galangal, kaffir lime leaves — simmer 3 min
3. Add shrimp, cook 2-3 min until pink
4. Season with fish sauce, sugar, lime juice
5. Add mushrooms if using — cook 1 min
6. Taste and adjust: sour/salty/spicy balance

## Plating
- Serve in 400ml bowl
- Garnish with fresh Thai chili and coriander
- Temperature: minimum 80°C

## Quality Standards
- Color: clear golden broth
- Taste: balanced sour, salty, spicy
- Shrimp: fully cooked, not rubbery

## Food Safety
- Ensure shrimp internal temp reaches 74°C
- Do not reuse unused broth
- Serve within 5 minutes of cooking`,
      imageUrls: [],
    },
  });

  console.log(`
✅ Seed complete!

📋 Test Credentials:
  Owner:   owner@goldenwok.co.th   / Admin1234!
  Manager: manager@goldenwok.co.th / Manager1234!
  Staff:   staff@goldenwok.co.th   / Staff1234!

🏢 Organization: The Golden Wok Restaurant
📊 Data: 4 suppliers, 15 ingredients, 5 recipes, 10 assets, 6 months P&L
  `);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
