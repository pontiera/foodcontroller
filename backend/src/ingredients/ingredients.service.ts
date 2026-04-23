import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export class CreateIngredientDto {
  supplierId?: string;
  code: string;
  name: string;
  brand?: string;
  foodCategory?: string;
  purchaseWeight: number;
  purchaseUnit: string;
  purchasePrice: number;
  lossPercentage?: number;
  caloriesPer100g?: number;
  proteinPer100g?: number;
  fatPer100g?: number;
  carbsPer100g?: number;
  sodiumPer100g?: number;
  fiberPer100g?: number;
}

export class UpdateIngredientDto extends CreateIngredientDto {}

@Injectable()
export class IngredientsService {
  constructor(private prisma: PrismaService) {}

  /**
   * CORE COST CALCULATION LOGIC
   * ingredient cost per gram = (purchasePrice / purchaseWeight) * (1 + lossPercentage / 100)
   */
  private calculateCosts(dto: Partial<CreateIngredientDto>) {
    const purchaseWeight = dto.purchaseWeight ?? 1;
    const purchasePrice = dto.purchasePrice ?? 0;
    const lossPercentage = dto.lossPercentage ?? 0;

    const pricePerKg = (purchasePrice / purchaseWeight) * 1000;
    const actualCostPerKg = pricePerKg * (1 + lossPercentage / 100);
    const actualCostPerGram = actualCostPerKg / 1000;

    return { pricePerKg, actualCostPerGram, actualCostPerKg };
  }

  async findAll(orgId: string, params: { supplierId?: string; category?: string; search?: string }) {
    const where: any = { organizationId: orgId, isActive: true };
    if (params.supplierId) where.supplierId = params.supplierId;
    if (params.category) where.foodCategory = params.category;
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { code: { contains: params.search, mode: 'insensitive' } },
        { brand: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.ingredient.findMany({
      where,
      include: { supplier: { select: { id: true, name: true, code: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(orgId: string, id: string) {
    const ingredient = await this.prisma.ingredient.findFirst({
      where: { id, organizationId: orgId },
      include: {
        supplier: true,
        recipeIngredients: {
          include: { recipe: { select: { id: true, name: true, code: true, category: true, sellingPrice: true } } },
        },
      },
    });
    if (!ingredient) throw new NotFoundException('Ingredient not found');
    return ingredient;
  }

  async create(orgId: string, dto: CreateIngredientDto) {
    const exists = await this.prisma.ingredient.findFirst({
      where: { organizationId: orgId, code: dto.code },
    });
    if (exists) throw new ConflictException(`Ingredient code '${dto.code}' already exists`);

    const costs = this.calculateCosts(dto);
    return this.prisma.ingredient.create({
      data: {
        organizationId: orgId,
        supplierId: dto.supplierId,
        code: dto.code,
        name: dto.name,
        brand: dto.brand,
        foodCategory: dto.foodCategory,
        purchaseWeight: dto.purchaseWeight,
        purchaseUnit: dto.purchaseUnit,
        purchasePrice: dto.purchasePrice,
        lossPercentage: dto.lossPercentage ?? 0,
        caloriesPer100g: dto.caloriesPer100g,
        proteinPer100g: dto.proteinPer100g,
        fatPer100g: dto.fatPer100g,
        carbsPer100g: dto.carbsPer100g,
        sodiumPer100g: dto.sodiumPer100g,
        fiberPer100g: dto.fiberPer100g,
        ...costs,
      },
    });
  }

  async update(orgId: string, id: string, dto: UpdateIngredientDto) {
    await this.findOne(orgId, id);
    const costs = this.calculateCosts(dto);

    const updated = await this.prisma.ingredient.update({
      where: { id },
      data: { ...dto, ...costs },
    });

    // Cascade recalculate all recipes using this ingredient
    await this.recalculateRecipesForIngredient(orgId, id);
    return updated;
  }

  async delete(orgId: string, id: string) {
    await this.findOne(orgId, id);
    return this.prisma.ingredient.update({ where: { id }, data: { isActive: false } });
  }

  async getCategories(orgId: string) {
    const results = await this.prisma.ingredient.findMany({
      where: { organizationId: orgId, isActive: true, foodCategory: { not: null } },
      select: { foodCategory: true },
      distinct: ['foodCategory'],
    });
    return results.map((r) => r.foodCategory).filter(Boolean);
  }

  private async recalculateRecipesForIngredient(orgId: string, ingredientId: string) {
    // Find all recipes using this ingredient and recalculate their costs
    const recipeIngredients = await this.prisma.recipeIngredient.findMany({
      where: { ingredientId },
      include: { ingredient: true },
    });

    const recipeIds = [...new Set(recipeIngredients.map((ri) => ri.recipeId))];

    for (const recipeId of recipeIds) {
      await this.recalculateRecipeCost(recipeId as string);
    }
  }

  async recalculateRecipeCost(recipeId: string) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        ingredients: {
          include: {
            ingredient: true,
            masterRecipe: true,
          },
        },
      },
    });
    if (!recipe) return;

    let totalIngredientCost = 0;
    for (const ri of recipe.ingredients) {
      let costPerGram = 0;
      if (ri.ingredient) {
        costPerGram = ri.ingredient.actualCostPerGram;
      } else if (ri.masterRecipe) {
        costPerGram = ri.masterRecipe.costPerGram;
      }
      const lineCost = costPerGram * ri.quantity;
      totalIngredientCost += lineCost;

      await this.prisma.recipeIngredient.update({
        where: { id: ri.id },
        data: { cost: lineCost },
      });
    }

    const totalCost = totalIngredientCost; // Add labor/overhead if set
    const grossProfit = recipe.sellingPrice - totalCost;
    const grossProfitMargin = recipe.sellingPrice > 0 ? (grossProfit / recipe.sellingPrice) * 100 : 0;
    const foodCostPercent = recipe.sellingPrice > 0 ? (totalCost / recipe.sellingPrice) * 100 : 0;

    await this.prisma.recipe.update({
      where: { id: recipeId },
      data: {
        totalIngredientCost,
        totalCost,
        grossProfit,
        grossProfitMargin,
        foodCostPercent,
      },
    });
  }
}
