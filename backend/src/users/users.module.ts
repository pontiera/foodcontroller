import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

export class UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  position?: string;
}

export class ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string, orgId: string) {
    const membership = await this.prisma.userOrganization.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, avatarUrl: true, emailVerified: true, createdAt: true } }, organization: true },
    });
    if (!membership) throw new NotFoundException('User not found');
    return { ...membership.user, role: membership.role, position: membership.position, organization: membership.organization };
  }

  async updateProfile(userId: string, orgId: string, dto: UpdateProfileDto) {
    const { position, ...userFields } = dto;
    await this.prisma.user.update({ where: { id: userId }, data: userFields });
    if (position) {
      await this.prisma.userOrganization.update({
        where: { userId_organizationId: { userId, organizationId: orgId } },
        data: { position },
      });
    }
    return this.getProfile(userId, orgId);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new Error('Current password is incorrect');
    const newHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });
    return { message: 'Password updated successfully' };
  }
}

// ── Controller ──
import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get('profile')
  profile(@GetUser('sub') userId: string, @GetUser('orgId') orgId: string) {
    return this.service.getProfile(userId, orgId);
  }

  @Put('profile')
  updateProfile(@GetUser('sub') userId: string, @GetUser('orgId') orgId: string, @Body() dto: UpdateProfileDto) {
    return this.service.updateProfile(userId, orgId, dto);
  }

  @Put('password')
  changePassword(@GetUser('sub') userId: string, @Body() dto: ChangePasswordDto) {
    return this.service.changePassword(userId, dto);
  }
}

// ── Module ──
import { Module } from '@nestjs/common';

@Module({ providers: [UsersService], controllers: [UsersController], exports: [UsersService] })
export class UsersModule {}
