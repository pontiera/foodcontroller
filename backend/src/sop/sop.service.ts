// sop.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export class CreateSopDto {
  code: string;
  title: string;
  category?: string;
  content: string;
  version?: string;
  imageUrls?: string[];
  videoUrl?: string;
}

@Injectable()
export class SopService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string, search?: string) {
    const where: any = { organizationId: orgId, isActive: true };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.sopDocument.findMany({
      where,
      select: { id: true, code: true, title: true, category: true, version: true, createdAt: true, updatedAt: true },
      orderBy: { category: 'asc' },
    });
  }

  async findOne(orgId: string, id: string) {
    const sop = await this.prisma.sopDocument.findFirst({
      where: { id, organizationId: orgId },
      include: { recipes: { select: { id: true, name: true, code: true } } },
    });
    if (!sop) throw new NotFoundException('SOP document not found');
    return sop;
  }

  async create(orgId: string, dto: CreateSopDto) {
    return this.prisma.sopDocument.create({
      data: {
        organizationId: orgId,
        code: dto.code,
        title: dto.title,
        category: dto.category,
        content: dto.content,
        version: dto.version ?? '1.0',
        imageUrls: dto.imageUrls ?? [],
        videoUrl: dto.videoUrl,
      },
    });
  }

  async update(orgId: string, id: string, dto: CreateSopDto) {
    await this.findOne(orgId, id);
    return this.prisma.sopDocument.update({ where: { id }, data: dto });
  }

  async delete(orgId: string, id: string) {
    await this.findOne(orgId, id);
    return this.prisma.sopDocument.update({ where: { id }, data: { isActive: false } });
  }
}
