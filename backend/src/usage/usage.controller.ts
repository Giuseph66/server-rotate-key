import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsageService } from './usage.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Usage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/usage')
export class UsageController {
  constructor(private usageService: UsageService) {}

  @Get('logs')
  @ApiOperation({ summary: 'Get recent usage logs' })
  getRecentLogs(@Query('limit') limit?: string) {
    return this.usageService.getRecentLogs(limit ? parseInt(limit) : 50);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get usage statistics and charts data' })
  getStats() {
    return this.usageService.getStats();
  }
}
