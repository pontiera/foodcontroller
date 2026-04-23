import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IngredientsService, CreateIngredientDto, UpdateIngredientDto } from './ingredients.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('Ingredients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ingredients')
export class IngredientsController {
  constructor(private readonly service: IngredientsService) {}

  @Get()
  @ApiOperation({ summary: 'List all ingredients' })
  findAll(
    @GetUser('orgId') orgId: string,
    @Query('supplierId') supplierId?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAll(orgId, { supplierId, category, search });
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get distinct ingredient categories' })
  getCategories(@GetUser('orgId') orgId: string) {
    return this.service.getCategories(orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ingredient with usage in recipes' })
  findOne(@GetUser('orgId') orgId: string, @Param('id') id: string) {
    return this.service.findOne(orgId, id);
  }

  @Post()
  @Roles('MANAGER', 'ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Create ingredient with auto cost calculation' })
  create(@GetUser('orgId') orgId: string, @Body() dto: CreateIngredientDto) {
    return this.service.create(orgId, dto);
  }

  @Put(':id')
  @Roles('MANAGER', 'ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Update ingredient — cascades cost recalculation to all recipes' })
  update(@GetUser('orgId') orgId: string, @Param('id') id: string, @Body() dto: UpdateIngredientDto) {
    return this.service.update(orgId, id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Soft-delete ingredient' })
  delete(@GetUser('orgId') orgId: string, @Param('id') id: string) {
    return this.service.delete(orgId, id);
  }
}
