import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export class UpsertFinancialDto {
  month: number;
  year: number;
  revenue: number;
  otherIncome?: number;
  foodCost: number;
  beverageCost?: number;
  laborCost: number;
  rent: number;
  utilities?: number;
  marketing?: number;
  maintenance?: number;
  depreciation?: number;
  otherExpenses?: number;
  notes?: string;
}

@Injectable()
export class FinancialsService {
  constructor(private prisma: PrismaService) {}

  private calculate(dto: UpsertFinancialDto) {
    const totalRevenue = dto.revenue + (dto.otherIncome ?? 0);
    const totalCOGS = dto.foodCost + (dto.beverageCost ?? 0);
    const grossProfit = totalRevenue - totalCOGS;
    const totalOpEx =
      dto.laborCost +
      dto.rent +
      (dto.utilities ?? 0) +
      (dto.marketing ?? 0) +
      (dto.maintenance ?? 0) +
      (dto.depreciation ?? 0) +
      (dto.otherExpenses ?? 0);
    const operatingProfit = grossProfit - totalOpEx;
    const netProfit = operatingProfit;
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    return { grossProfit, operatingProfit, netProfit, grossMargin, netMargin };
  }

  async upsert(orgId: string, dto: UpsertFinancialDto) {
    const calc = this.calculate(dto);
    return this.prisma.financialRecord.upsert({
      where: { organizationId_month_year: { organizationId: orgId, month: dto.month, year: dto.year } },
      create: {
        organizationId: orgId,
        month: dto.month,
        year: dto.year,
        revenue: dto.revenue,
        otherIncome: dto.otherIncome ?? 0,
        foodCost: dto.foodCost,
        beverageCost: dto.beverageCost ?? 0,
        laborCost: dto.laborCost,
        rent: dto.rent,
        utilities: dto.utilities ?? 0,
        marketing: dto.marketing ?? 0,
        maintenance: dto.maintenance ?? 0,
        depreciation: dto.depreciation ?? 0,
        otherExpenses: dto.otherExpenses ?? 0,
        notes: dto.notes,
        ...calc,
      },
      update: {
        revenue: dto.revenue,
        otherIncome: dto.otherIncome ?? 0,
        foodCost: dto.foodCost,
        beverageCost: dto.beverageCost ?? 0,
        laborCost: dto.laborCost,
        rent: dto.rent,
        utilities: dto.utilities ?? 0,
        marketing: dto.marketing ?? 0,
        maintenance: dto.maintenance ?? 0,
        depreciation: dto.depreciation ?? 0,
        otherExpenses: dto.otherExpenses ?? 0,
        notes: dto.notes,
        ...calc,
      },
    });
  }

  async findByYear(orgId: string, year: number) {
    const records = await this.prisma.financialRecord.findMany({
      where: { organizationId: orgId, year },
      orderBy: { month: 'asc' },
    });

    const totals = records.reduce(
      (acc, r) => ({
        revenue: acc.revenue + r.revenue,
        foodCost: acc.foodCost + r.foodCost,
        beverageCost: acc.beverageCost + r.beverageCost,
        laborCost: acc.laborCost + r.laborCost,
        grossProfit: acc.grossProfit + r.grossProfit,
        netProfit: acc.netProfit + r.netProfit,
      }),
      { revenue: 0, foodCost: 0, beverageCost: 0, laborCost: 0, grossProfit: 0, netProfit: 0 },
    );

    const avgGrossMargin = records.length > 0
      ? records.reduce((s, r) => s + r.grossMargin, 0) / records.length
      : 0;

    return { records, totals, avgGrossMargin, year };
  }

  async getDashboard(orgId: string) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    const [yearData, currentMonthRecord, prevMonthRecord, recipeCount, ingredientCount, supplierCount] =
      await Promise.all([
        this.findByYear(orgId, currentYear),
        this.prisma.financialRecord.findUnique({
          where: { organizationId_month_year: { organizationId: orgId, month: currentMonth, year: currentYear } },
        }),
        this.prisma.financialRecord.findUnique({
          where: { organizationId_month_year: { organizationId: orgId, month: prevMonth, year: prevYear } },
        }),
        this.prisma.recipe.count({ where: { organizationId: orgId, isActive: true } }),
        this.prisma.ingredient.count({ where: { organizationId: orgId, isActive: true } }),
        this.prisma.supplier.count({ where: { organizationId: orgId, isActive: true } }),
      ]);

    const revenueChange =
      prevMonthRecord && prevMonthRecord.revenue > 0
        ? ((currentMonthRecord?.revenue ?? 0) - prevMonthRecord.revenue) / prevMonthRecord.revenue * 100
        : 0;

    return {
      currentMonth: { month: currentMonth, year: currentYear, data: currentMonthRecord },
      prevMonth: { month: prevMonth, year: prevYear, data: prevMonthRecord },
      revenueChange,
      yearData,
      counts: { recipes: recipeCount, ingredients: ingredientCount, suppliers: supplierCount },
    };
  }

  async findOne(orgId: string, month: number, year: number) {
    const record = await this.prisma.financialRecord.findUnique({
      where: { organizationId_month_year: { organizationId: orgId, month, year } },
    });
    if (!record) throw new NotFoundException('Financial record not found');
    return record;
  }
}
