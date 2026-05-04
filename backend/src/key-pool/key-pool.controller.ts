import {
  Controller, Get, Post, Put, Delete, Body, Param, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { KeyPoolService } from './key-pool.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/roles.decorator';
import { CreateApiKeyDto, UpdateApiKeyDto } from './dto/api-key.dto';

@ApiTags('Key Pool')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('api/keys')
export class KeyPoolController {
  constructor(private keyPoolService: KeyPoolService) {}

  @Get()
  @ApiOperation({ summary: 'List all API keys' })
  findAll() {
    return this.keyPoolService.findAll();
  }

  @Get('status')
  @ApiOperation({ summary: 'Get pool status overview' })
  getPoolStatus() {
    return this.keyPoolService.getPoolStatus();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get API key by ID' })
  findOne(@Param('id') id: string) {
    return this.keyPoolService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Add a new API key to the pool' })
  create(@Body() dto: CreateApiKeyDto) {
    return this.keyPoolService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an API key' })
  update(@Param('id') id: string, @Body() dto: UpdateApiKeyDto) {
    return this.keyPoolService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove an API key from the pool' })
  remove(@Param('id') id: string) {
    return this.keyPoolService.remove(id);
  }

  @Post(':id/toggle')
  @ApiOperation({ summary: 'Toggle API key active/inactive' })
  toggleActive(@Param('id') id: string) {
    return this.keyPoolService.toggleActive(id);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Test a single API key' })
  testKey(@Param('id') id: string) {
    return this.keyPoolService.testKey(id);
  }

  @Post('test-all')
  @ApiOperation({ summary: 'Test all active API keys' })
  testAllKeys() {
    return this.keyPoolService.testAllKeys();
  }
}
