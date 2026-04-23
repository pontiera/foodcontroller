import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export class UpdateOrganizationDto {
  name?: string;
  type?: string;
  taxId?: string;
  address?: string;
  phone?: string;
  mobile?: string;
  fax?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  isHeadOffice?: boolean;
  branchCode?: string;
  operationStartDate?: Date;
  language?: string;
  timezone?: string;
  currency?: string;
}

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async findOne(orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: { documentSettings: true },
    });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async update(orgId: string, dto: UpdateOrganizationDto) {
    return this.prisma.organization.update({ where: { id: orgId }, data: dto });
  }

  async getMembers(orgId: string) {
    return this.prisma.userOrganization.findMany({
      where: { organizationId: orgId },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true, emailVerified: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async inviteMember(orgId: string, email: string, role: string, position?: string) {
    // Find user by email (simplified; production would send email invite)
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User with this email not found. Ask them to register first.');

    const existing = await this.prisma.userOrganization.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId: orgId } },
    });
    if (existing) {
      return this.prisma.userOrganization.update({
        where: { userId_organizationId: { userId: user.id, organizationId: orgId } },
        data: { role: role as any, position, isActive: true, joinedAt: new Date() },
      });
    }

    return this.prisma.userOrganization.create({
      data: { userId: user.id, organizationId: orgId, role: role as any, position, joinedAt: new Date() },
    });
  }

  async removeMember(orgId: string, userId: string) {
    return this.prisma.userOrganization.update({
      where: { userId_organizationId: { userId, organizationId: orgId } },
      data: { isActive: false },
    });
  }

  async updateDocumentSettings(orgId: string, data: any) {
    return this.prisma.documentSetting.upsert({
      where: { organizationId: orgId },
      create: { organizationId: orgId, ...data },
      update: data,
    });
  }
}

// ── Module ──
import { Module } from '@nestjs/common';
import { OrganizationsController } from './organizations.controller';

@Module({ providers: [OrganizationsService], controllers: [OrganizationsController], exports: [OrganizationsService] })
export class OrganizationsModule {}
