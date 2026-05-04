import {
  Controller, Post, Get, Put, Body, Req, Res, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { GatewayService } from './gateway.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Gateway')
@Controller('api')
export class GatewayController {
  constructor(private gatewayService: GatewayService) {}

  @Post('chat')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Proxy chat request to Ollama Cloud with key rotation' })
  async chat(@Body() body: any, @Req() req: any, @Res() res: Response) {
    const tenantId = req.user?.id;

    if (body.stream) {
      try {
        const { stream, keysUsed } = await this.gatewayService.proxyStreamRequest(
          '/api/chat', body, tenantId,
        );
        res.setHeader('Content-Type', 'application/x-ndjson');
        res.setHeader('Transfer-Encoding', 'chunked');
        res.setHeader('X-Keys-Used', JSON.stringify(keysUsed));

        const reader = (stream as any).getReader();
        const decoder = new TextDecoder();

        const pump = async () => {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              res.end();
              return;
            }
            res.write(decoder.decode(value, { stream: true }));
          }
        };
        await pump();
      } catch (error) {
        const status = error.getStatus ? error.getStatus() : 500;
        res.status(status).json(error.getResponse ? error.getResponse() : { error: error.message });
      }
      return;
    }

    try {
      const result = await this.gatewayService.proxyRequest('/api/chat', body, tenantId);
      res.json(result);
    } catch (error) {
      const status = error.getStatus ? error.getStatus() : 500;
      res.status(status).json(error.getResponse ? error.getResponse() : { error: error.message });
    }
  }

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Proxy generate request to Ollama Cloud with key rotation' })
  async generate(@Body() body: any, @Req() req: any, @Res() res: Response) {
    const tenantId = req.user?.id;

    if (body.stream) {
      try {
        const { stream, keysUsed } = await this.gatewayService.proxyStreamRequest(
          '/api/generate', body, tenantId,
        );
        res.setHeader('Content-Type', 'application/x-ndjson');
        res.setHeader('Transfer-Encoding', 'chunked');
        res.setHeader('X-Keys-Used', JSON.stringify(keysUsed));

        const reader = (stream as any).getReader();
        const decoder = new TextDecoder();

        const pump = async () => {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              res.end();
              return;
            }
            res.write(decoder.decode(value, { stream: true }));
          }
        };
        await pump();
      } catch (error) {
        const status = error.getStatus ? error.getStatus() : 500;
        res.status(status).json(error.getResponse ? error.getResponse() : { error: error.message });
      }
      return;
    }

    try {
      const result = await this.gatewayService.proxyRequest('/api/generate', body, tenantId);
      res.json(result);
    } catch (error) {
      const status = error.getStatus ? error.getStatus() : 500;
      res.status(status).json(error.getResponse ? error.getResponse() : { error: error.message });
    }
  }

  @Get('tags')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List available models from Ollama Cloud' })
  async listModels(@Req() req: any) {
    return this.gatewayService.listModels(req.user?.id);
  }

  @Get('settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get gateway settings' })
  async getSettings() {
    return this.gatewayService.getSettings();
  }

  @Put('settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update gateway settings' })
  async updateSettings(@Body() body: any) {
    return this.gatewayService.updateSettings(body);
  }
}
