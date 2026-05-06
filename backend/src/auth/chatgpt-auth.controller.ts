import { Controller, Get, Query, Res, Req, UseGuards, Delete } from '@nestjs/common';
import { Response } from 'express';
import { ChatGPTAuthService } from './chatgpt-auth.service';
import { GatewayAuthGuard } from './gateway-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('api/auth/chatgpt')
export class ChatGPTAuthController {
  constructor(private readonly authService: ChatGPTAuthService) {}

  @Get('login')
  @UseGuards(GatewayAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start ChatGPT OAuth login flow' })
  async login(@Req() req: any) {
    const tenantId = req.user.id;
    const url = await this.authService.startLogin(tenantId);
    return { url };
  }

  @Get('callback')
  @ApiOperation({ summary: 'ChatGPT OAuth callback' })
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      await this.authService.handleCallback(code, state);
      // Redirect back to frontend keys page
      res.redirect('http://localhost:5173/keys?chatgpt=connected');
    } catch (error) {
      res.redirect(`http://localhost:5173/keys?chatgpt=error&message=${encodeURIComponent(error.message)}`);
    }
  }

  @Delete('disconnect')
  @UseGuards(GatewayAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disconnect ChatGPT account' })
  async disconnect(@Req() req: any) {
    const tenantId = req.user.id;
    await this.authService.disconnect(tenantId);
    return { success: true };
  }
}
