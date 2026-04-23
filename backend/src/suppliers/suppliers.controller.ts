// suppliers.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SuppliersService, CreateSupplierDto } from './suppliers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('Suppliers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly service: SuppliersService) {}

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
  create(@GetUser('orgId') orgId: string, @Body() dto: CreateSupplierDto) {
    return this.service.create(orgId, dto);
  }

  @Put(':id')
  @Roles('MANAGER', 'ADMIN', 'OWNER')
  update(@GetUser('orgId') orgId: string, @Param('id') id: string, @Body() dto: CreateSupplierDto) {
    return this.service.update(orgId, id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'OWNER')
  delete(@GetUser('orgId') orgId: string, @Param('id') id: string) {
    return this.service.delete(orgId, id);
  }
}
