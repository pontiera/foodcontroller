import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SopService, CreateSopDto } from './sop.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('SOP')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sop')
export class SopController {
  constructor(private readonly service: SopService) {}

  @Get()
  findAll(@GetUser('orgId') orgId: string, @Query('search') search?: string) {
    return this.service.findAll(orgId, search);
  }

  @Get(':id')
  findOne(@GetUser('orgId') orgId: string, @Param('id') id: string) {
    return this.service.findOne(orgId, id);
  }

  @Post()
  @Roles('MANAGER', 'ADMIN', 'OWNER')
  create(@GetUser('orgId') orgId: string, @Body() dto: CreateSopDto) {
    return this.service.create(orgId, dto);
  }

  @Put(':id')
  @Roles('MANAGER', 'ADMIN', 'OWNER')
  update(@GetUser('orgId') orgId: string, @Param('id') id: string, @Body() dto: CreateSopDto) {
    return this.service.update(orgId, id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'OWNER')
  delete(@GetUser('orgId') orgId: string, @Param('id') id: string) {
    return this.service.delete(orgId, id);
  }
}

// sop.module.ts (inline)
import { Module } from '@nestjs/common';

@Module({ providers: [SopService], controllers: [SopController], exports: [SopService] })
export class SopModule {}
