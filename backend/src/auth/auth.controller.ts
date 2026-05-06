import {
  Controller, Post, Get, Put, Body, Req, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { GatewayAuthGuard } from './gateway-auth.guard';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login with tenant credentials' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.name, dto.password);
  }

  @Get('profile')
  @UseGuards(GatewayAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current tenant profile' })
  async getProfile(@Req() req: any) {
    return this.authService.getProfile(req.user.id);
  }

  @Post('profile/api-key')
  @UseGuards(GatewayAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate or regenerate system API key' })
  async generateApiKey(@Req() req: any) {
    return this.authService.generateSystemApiKey(req.user.id);
  }

  @Put('profile/default-model')
  @UseGuards(GatewayAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update default model for the tenant' })
  async updateDefaultModel(@Req() req: any, @Body('model') model: string) {
    return this.authService.updateDefaultModel(req.user.id, model);
  }

  @Put('profile/default-provider')
  @UseGuards(GatewayAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update default provider for the tenant' })
  async updateDefaultProvider(@Req() req: any, @Body('provider') provider: string) {
    return this.authService.updateDefaultProvider(req.user.id, provider);
  }

  @Put('profile/password')
  @UseGuards(GatewayAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update tenant password' })
  async updatePassword(@Req() req: any, @Body() body: any) {
    return this.authService.updatePassword(req.user.id, body.currentPassword, body.newPassword);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new tenant' })
  async register(@Body() body: any) {
    return this.authService.register(body.name, body.email, body.password);
  }
}
