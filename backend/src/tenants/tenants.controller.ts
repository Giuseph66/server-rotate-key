import {
  Controller, Get, Post, Put, Delete, Body, Param, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/roles.decorator';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('api/tenants')
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Get()
  @ApiOperation({ summary: 'List all tenants (admin only)' })
  findAll() {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tenant by ID (admin only)' })
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new tenant (admin only)' })
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a tenant (admin only)' })
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a tenant (admin only)' })
  remove(@Param('id') id: string) {
    return this.tenantsService.remove(id);
  }
}
