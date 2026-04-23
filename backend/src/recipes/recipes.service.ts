import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export class RecipeIngredientDto {
  ingredientId?: string;
  masterRecipeId?: string;
  quantity: number; // in grams
  unit?: string;
  notes?: string;
  sortOrder?: number;
}

export class CreateRecipeDto {
  code: string;
  name: string;
  description?: string;
  category?: string;
  servingSize?: number;
  servingUnit?: string;
  sellingPrice: number;
  laborCostPercent?: number;
  overheadPercent?: number;
  instructions?: string;
  imageUrl?: string;
  sopDocumentId?: string;
  ingredients: RecipeIngredientDto[];
}

export class UpdateRecipeDto extends CreateRecipeDto {}

@Injectable()
export class RecipesService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string, params: { category?: string; search?: string }) {
    const where: any = { organizationId: orgId, isActive: true };
    if (params.category) where.category = params.category;
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { code: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.recipe.findMany({
      where,
      select: {
        id: true, code: true, name: true, category: true,
        sellingPrice: true, totalCost: true, grossProfit: true,
        grossProfitMargin: true, foodCostPercent: true,
        totalCalories: true, imageUrl: true, isActive: true, createdAt: true,
      },
      orderBy: { category: 'asc' },
    });
  }

  async findOne(orgId: string, id: string) {
    const recipe = await this.prisma.recipe.findFirst({
      where: { id, organizationId: orgId },
      include: {
        ingredients: {
          include: {
            ingredient: { include: { supplier: { select: { id: true, name: true } } } },
            masterRecipe: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
        sopDocument: true,
      },
    });
    if (!recipe) throw new NotFoundException('Recipe not found');
    return recipe;
  }

  async create(orgId: string, dto: CreateRecipeDto) {
    const exists = await this.prisma.recipe.findFirst({
      where: { organizationId: orgId, code: dto.code },
    });
    if (exists) throw new ConflictException(`Recipe code '${dto.code}' already exists`);

    const recipe = await this.prisma.recipe.create({
      data: {
        organizationId: orgId,
        code: dto.code,
        name: dto.name,
        description: dto.description,
        category: dto.category,
        servingSize: dto.servingSize ?? 1,
        servingUnit: dto.servingUnit ?? 'portion',
        sellingPrice: dto.sellingPrice,
        laborCostPercent: dto.laborCostPercent ?? 0,
        overheadPercent: dto.overheadPercent ?? 0,
        instructions: dto.instructions,
        imageUrl: dto.imageUrl,
        sopDocumentId: dto.sopDocumentId,
        ingredients: {
          create: dto.ingredients.map((ing, i) => ({
            ingredientId: ing.ingredientId,
            masterRecipeId: ing.masterRecipeId,
            quantity: ing.quantity,
            unit: ing.unit ?? 'g',
            notes: ing.notes,
            sortOrder: ing.sortOrder ?? i,
          })),
        },
      },
    });

    await this.recalculateCost(recipe.id);
    return this.findOne(orgId, recipe.id);
  }

  async update(orgId: string, id: string, dto: UpdateRecipeDto) {
    await this.findOne(orgId, id);

    // Replace all ingredients
    await this.prisma.recipeIngredient.deleteMany({ where: { recipeId: id } });

    await this.prisma.recipe.update({
      where: { id },
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        category: dto.category,
        servingSize: dto.servingSize ?? 1,
        servingUnit: dto.servingUnit ?? 'portion',
        sellingPrice: dto.sellingPrice,
        laborCostPercent: dto.laborCostPercent ?? 0,
        overheadPercent: dto.overheadPercent ?? 0,
        instructions: dto.instructions,
        imageUrl: dto.imageUrl,
        sopDocumentId: dto.sopDocumentId,
        ingredients: {
          create: dto.ingredients.map((ing, i) => ({
            ingredientId: ing.ingredientId,
            masterRecipeId: ing.masterRecipeId,
            quantity: ing.quantity,
            unit: ing.unit ?? 'g',
            notes: ing.notes,
            sortOrder: ing.sortOrder ?? i,
          })),
        },
      },
    });

    await this.recalculateCost(id);
    return this.findOne(orgId, id);
  }

  async delete(orgId: string, id: string) {
    await this.findOne(orgId, id);
    return this.prisma.recipe.update({ where: { id }, data: { isActive: false } });
  }

  /**
   * CORE COST CALCULATION
   * For each ingredient line:
   *   cost = ingredient.actualCostPerGram * quantity_grams
   * totalIngredientCost = SUM of all line costs
   * totalCost = totalIngredientCost * (1 + laborCostPercent/100 + overheadPercent/100)
   * grossProfit = sellingPrice - totalCost
   * grossProfitMargin = (grossProfit / sellingPrice) * 100
   * foodCostPercent = (totalCost / sellingPrice) * 100
   */
  async recalculateCost(recipeId: string) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        ingredients: {
          include: { ingredient: true, masterRecipe: true },
        },
      },
    });
    if (!recipe) return;

    let totalIngredientCost = 0;
    let totalCalories = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalCarbs = 0;

    for (const ri of recipe.ingredients) {
      let costPerGram = 0;
      if (ri.ingredient) {
        costPerGram = ri.ingredient.actualCostPerGram;
        // Nutrition calculation
        const factor = ri.quantity / 100;
        totalCalories += (ri.ingredient.caloriesPer100g ?? 0) * factor;
        totalProtein += (ri.ingredient.proteinPer100g ?? 0) * factor;
        totalFat += (ri.ingredient.fatPer100g ?? 0) * factor;
        totalCarbs += (ri.ingredient.carbsPer100g ?? 0) * factor;
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

    const multiplier = 1 + (recipe.laborCostPercent + recipe.overheadPercent) / 100;
    const totalCost = totalIngredientCost * multiplier;
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
        totalCalories: totalCalories || null,
        totalProtein: totalProtein || null,
        totalFat: totalFat || null,
        totalCarbs: totalCarbs || null,
      },
    });
  }

  async calculateCostPreview(orgId: string, ingredients: RecipeIngredientDto[], sellingPrice: number, laborCostPercent = 0, overheadPercent = 0) {
    let totalIngredientCost = 0;
    const lines: any[] = [];

    for (const ri of ingredients) {
      let costPerGram = 0;
      let name = '';
      if (ri.ingredientId) {
        const ing = await this.prisma.ingredient.findFirst({
          where: { id: ri.ingredientId, organizationId: orgId },
        });
        if (ing) { costPerGram = ing.actualCostPerGram; name = ing.name; }
      } else if (ri.masterRecipeId) {
        const mr = await this.prisma.masterRecipe.findFirst({
          where: { id: ri.masterRecipeId, organizationId: orgId },
        });
        if (mr) { costPerGram = mr.costPerGram; name = mr.name; }
      }
      const lineCost = costPerGram * ri.quantity;
      totalIngredientCost += lineCost;
      lines.push({ name, quantity: ri.quantity, costPerGram, lineCost });
    }

    const multiplier = 1 + (laborCostPercent + overheadPercent) / 100;
    const totalCost = totalIngredientCost * multiplier;
    const grossProfit = sellingPrice - totalCost;
    const grossProfitMargin = sellingPrice > 0 ? (grossProfit / sellingPrice) * 100 : 0;
    const foodCostPercent = sellingPrice > 0 ? (totalCost / sellingPrice) * 100 : 0;

    return { lines, totalIngredientCost, totalCost, grossProfit, grossProfitMargin, foodCostPercent };
  }

  async getAnalytics(orgId: string) {
    const recipes = await this.prisma.recipe.findMany({
      where: { organizationId: orgId, isActive: true },
      select: {
        id: true, name: true, category: true, sellingPrice: true,
        totalCost: true, grossProfitMargin: true, foodCostPercent: true,
      },
    });

    // Menu Engineering Matrix (Stars/Plowhorses/Puzzles/Dogs)
    const avgMargin = recipes.reduce((s, r) => s + r.grossProfitMargin, 0) / (recipes.length || 1);
    const analyzed = recipes.map((r) => ({
      ...r,
      classification:
        r.grossProfitMargin >= avgMargin
          ? r.sellingPrice >= avgMargin ? 'Star' : 'Plowhorse'
          : r.sellingPrice >= avgMargin ? 'Puzzle' : 'Dog',
    }));

    return {
      totalRecipes: recipes.length,
      avgFoodCostPercent: recipes.reduce((s, r) => s + r.foodCostPercent, 0) / (recipes.length || 1),
      avgGrossMargin: avgMargin,
      byCategory: this.groupByCategory(recipes),
      menuEngineering: analyzed,
    };
  }

  private groupByCategory(recipes: any[]) {
    return recipes.reduce((acc, r) => {
      const cat = r.category || 'Uncategorized';
      if (!acc[cat]) acc[cat] = { count: 0, avgMargin: 0, avgFoodCost: 0 };
      acc[cat].count++;
      acc[cat].avgMargin += r.grossProfitMargin;
      acc[cat].avgFoodCost += r.foodCostPercent;
      return acc;
    }, {} as Record<string, any>);
  }
}
