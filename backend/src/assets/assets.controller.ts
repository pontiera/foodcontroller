import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AssetsService, CreateAssetDto } from './assets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('Assets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('assets')
export class AssetsController {
  constructor(private readonly service: AssetsService) {}

  @Get()
  findAll(
    @GetUser('orgId') orgId: string,
    @Query('department') department?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAll(orgId, { department, search });
  }

  @Get('summary')
  summary(@GetUser('orgId') orgId: string) {
    return this.service.getSummary(orgId);
  }

  @Get(':id')
  findOne(@GetUser('orgId') orgId: string, @Param('id') id: string) {
    return this.service.findOne(orgId, id);
  }

  @Post()
  @Roles('MANAGER', 'ADMIN', 'OWNER')
  create(@GetUser('orgId') orgId: string, @Body() dto: CreateAssetDto) {
    return this.service.create(orgId, dto);
  }

  @Put(':id')
  @Roles('MANAGER', 'ADMIN', 'OWNER')
  update(@GetUser('orgId') orgId: string, @Param('id') id: string, @Body() dto: CreateAssetDto) {
    return this.service.update(orgId, id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'OWNER')
  delete(@GetUser('orgId') orgId: string, @Param('id') id: string) {
    return this.service.delete(orgId, id);
  }
}
