// suppliers.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export class CreateSupplierDto {
  code: string;
  name: string;
  taxId?: string;
  address?: string;
  isHeadOffice?: boolean;
  branchCode?: string;
  creditDays?: number;
  contactName?: string;
  mobile?: string;
  officePhone?: string;
  email?: string;
  bankName?: string;
  bankAccount?: string;
  bankBranch?: string;
  bankAccountType?: string;
}

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string, search?: string) {
    const where: any = { organizationId: orgId, isActive: true };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.supplier.findMany({
      where,
      include: {
        _count: { select: { ingredients: true, assets: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(orgId: string, id: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, organizationId: orgId },
      include: {
        ingredients: { where: { isActive: true }, select: { id: true, name: true, code: true, actualCostPerGram: true } },
        assets: { where: { isActive: true }, select: { id: true, name: true, code: true, totalValue: true } },
        promotions: { where: { isActive: true }, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  async create(orgId: string, dto: CreateSupplierDto) {
    const exists = await this.prisma.supplier.findFirst({
      where: { organizationId: orgId, code: dto.code },
    });
    if (exists) throw new ConflictException(`Supplier code '${dto.code}' already exists`);

    return this.prisma.supplier.create({
      data: { organizationId: orgId, ...dto, creditDays: dto.creditDays ?? 30 },
    });
  }

  async update(orgId: string, id: string, dto: CreateSupplierDto) {
    await this.findOne(orgId, id);
    return this.prisma.supplier.update({ where: { id }, data: dto });
  }

  async delete(orgId: string, id: string) {
    await this.findOne(orgId, id);
    return this.prisma.supplier.update({ where: { id }, data: { isActive: false } });
  }
}
