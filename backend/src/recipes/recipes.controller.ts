import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RecipesService, CreateRecipeDto, UpdateRecipeDto, RecipeIngredientDto } from './recipes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

class CostPreviewDto {
  ingredients: RecipeIngredientDto[];
  sellingPrice: number;
  laborCostPercent?: number;
  overheadPercent?: number;
}

@ApiTags('Recipes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('recipes')
export class RecipesController {
  constructor(private readonly service: RecipesService) {}

  @Get()
  @ApiOperation({ summary: 'List all recipes with cost summary' })
  findAll(
    @GetUser('orgId') orgId: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAll(orgId, { category, search });
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Menu engineering & analytics dashboard' })
  analytics(@GetUser('orgId') orgId: string) {
    return this.service.getAnalytics(orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full recipe with ingredients and costs' })
  findOne(@GetUser('orgId') orgId: string, @Param('id') id: string) {
    return this.service.findOne(orgId, id);
  }

  @Post('cost-preview')
  @ApiOperation({ summary: 'Preview cost calculation before saving' })
  costPreview(@GetUser('orgId') orgId: string, @Body() dto: CostPreviewDto) {
    return this.service.calculateCostPreview(orgId, dto.ingredients, dto.sellingPrice, dto.laborCostPercent, dto.overheadPercent);
  }

  @Post()
  @Roles('MANAGER', 'ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Create recipe with auto cost calculation' })
  create(@GetUser('orgId') orgId: string, @Body() dto: CreateRecipeDto) {
    return this.service.create(orgId, dto);
  }

  @Put(':id')
  @Roles('MANAGER', 'ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Update recipe — recalculates all costs' })
  update(@GetUser('orgId') orgId: string, @Param('id') id: string, @Body() dto: UpdateRecipeDto) {
    return this.service.update(orgId, id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Soft delete recipe' })
  delete(@GetUser('orgId') orgId: string, @Param('id') id: string) {
    return this.service.delete(orgId, id);
  }
}
