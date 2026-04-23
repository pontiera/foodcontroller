// ============================================================
// ASSETS SERVICE
// ============================================================
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export class CreateAssetDto {
  supplierId?: string;
  code: string;
  name: string;
  brand?: string;
  skuCode?: string;
  department?: string;
  imageUrl?: string;
  quantity: number;
  unit?: string;
  pricePerUnit: number;
  purchaseDate?: Date;
  warrantyExpiry?: Date;
  condition?: string;
  notes?: string;
}

@Injectable()
export class AssetsService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string, params: { department?: string; search?: string }) {
    const where: any = { organizationId: orgId, isActive: true };
    if (params.department) where.department = params.department;
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { code: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.asset.findMany({
      where,
      include: { supplier: { select: { id: true, name: true } } },
      orderBy: { department: 'asc' },
    });
  }

  async findOne(orgId: string, id: string) {
    const asset = await this.prisma.asset.findFirst({
      where: { id, organizationId: orgId },
      include: { supplier: true },
    });
    if (!asset) throw new NotFoundException('Asset not found');
    return asset;
  }

  async create(orgId: string, dto: CreateAssetDto) {
    const totalValue = dto.quantity * dto.pricePerUnit;
    return this.prisma.asset.create({
      data: {
        organizationId: orgId,
        supplierId: dto.supplierId,
        code: dto.code,
        name: dto.name,
        brand: dto.brand,
        skuCode: dto.skuCode,
        department: dto.department,
        imageUrl: dto.imageUrl,
        quantity: dto.quantity,
        unit: dto.unit ?? 'unit',
        pricePerUnit: dto.pricePerUnit,
        totalValue,
        purchaseDate: dto.purchaseDate,
        warrantyExpiry: dto.warrantyExpiry,
        condition: (dto.condition as any) ?? 'GOOD',
        notes: dto.notes,
      },
    });
  }

  async update(orgId: string, id: string, dto: CreateAssetDto) {
    await this.findOne(orgId, id);
    const totalValue = dto.quantity * dto.pricePerUnit;
    return this.prisma.asset.update({ where: { id }, data: { ...dto, totalValue, condition: dto.condition as any } });
  }

  async delete(orgId: string, id: string) {
    await this.findOne(orgId, id);
    return this.prisma.asset.update({ where: { id }, data: { isActive: false } });
  }

  async getSummary(orgId: string) {
    const assets = await this.prisma.asset.findMany({
      where: { organizationId: orgId, isActive: true },
      select: { department: true, totalValue: true, quantity: true },
    });
    const totalValue = assets.reduce((s, a) => s + a.totalValue, 0);
    const totalItems = assets.reduce((s, a) => s + a.quantity, 0);
    const byDepartment = assets.reduce((acc, a) => {
      const dept = a.department || 'General';
      acc[dept] = (acc[dept] || 0) + a.totalValue;
      return acc;
    }, {} as Record<string, number>);
    return { totalValue, totalItems, byDepartment, assetCount: assets.length };
  }
}
