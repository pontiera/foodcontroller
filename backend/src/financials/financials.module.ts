import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FinancialsService, UpsertFinancialDto } from './financials.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('Financials / P&L')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('financials')
export class FinancialsController {
  constructor(private readonly service: FinancialsService) {}

  @Get('dashboard')
  dashboard(@GetUser('orgId') orgId: string) {
    return this.service.getDashboard(orgId);
  }

  @Get('year/:year')
  byYear(@GetUser('orgId') orgId: string, @Param('year') year: number) {
    return this.service.findByYear(orgId, +year);
  }

  @Get(':year/:month')
  findOne(@GetUser('orgId') orgId: string, @Param('year') year: number, @Param('month') month: number) {
    return this.service.findOne(orgId, +month, +year);
  }

  @Post()
  @Roles('MANAGER', 'ADMIN', 'OWNER')
  upsert(@GetUser('orgId') orgId: string, @Body() dto: UpsertFinancialDto) {
    return this.service.upsert(orgId, dto);
  }
}

// ── Module ──
import { Module } from '@nestjs/common';

@Module({ providers: [FinancialsService], controllers: [FinancialsController], exports: [FinancialsService] })
export class FinancialsModule {}
