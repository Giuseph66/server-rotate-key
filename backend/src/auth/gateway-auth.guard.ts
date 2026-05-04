import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class GatewayAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization header format');
    }

    // First try to verify as JWT (from the web UI)
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'ollama-pool-gateway-secret-key-2024',
      });
      request.user = {
        id: payload.sub,
        name: payload.name,
        role: payload.role,
      };
      return true;
    } catch (err) {
      // If JWT verification fails, check if it is a System API Key
      const tenant = await this.prisma.tenant.findUnique({
        where: { systemApiKey: token },
      });

      if (tenant && tenant.isActive) {
        request.user = {
          id: tenant.id,
          name: tenant.name,
          role: tenant.role,
        };
        return true;
      }

      throw new UnauthorizedException('Invalid API Key or token');
    }
  }
}
