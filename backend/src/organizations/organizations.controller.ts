import { Controller, Get, Put, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationsService, UpdateOrganizationDto } from './organizations.module';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('Organization')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organization')
export class OrganizationsController {
  constructor(private readonly service: OrganizationsService) {}

  @Get()
  findOne(@GetUser('orgId') orgId: string) {
    return this.service.findOne(orgId);
  }

  @Put()
  @Roles('ADMIN', 'OWNER')
  update(@GetUser('orgId') orgId: string, @Body() dto: UpdateOrganizationDto) {
    return this.service.update(orgId, dto);
  }

  @Get('members')
  getMembers(@GetUser('orgId') orgId: string) {
    return this.service.getMembers(orgId);
  }

  @Post('members/invite')
  @Roles('ADMIN', 'OWNER')
  invite(
    @GetUser('orgId') orgId: string,
    @Body() body: { email: string; role: string; position?: string },
  ) {
    return this.service.inviteMember(orgId, body.email, body.role, body.position);
  }

  @Delete('members/:userId')
  @Roles('ADMIN', 'OWNER')
  removeMember(@GetUser('orgId') orgId: string, @Param('userId') userId: string) {
    return this.service.removeMember(orgId, userId);
  }

  @Put('document-settings')
  @Roles('ADMIN', 'OWNER')
  updateDocSettings(@GetUser('orgId') orgId: string, @Body() data: any) {
    return this.service.updateDocumentSettings(orgId, data);
  }
}
