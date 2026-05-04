import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(name: string, password: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { name } });
    if (!tenant || !tenant.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, tenant.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: tenant.id, name: tenant.name, role: tenant.role };
    return {
      access_token: this.jwtService.sign(payload),
      tenant: {
        id: tenant.id,
        name: tenant.name,
        email: tenant.email,
        role: tenant.role,
      },
    };
  }

  async validateTenant(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant || !tenant.isActive) {
      throw new UnauthorizedException('Tenant not found or inactive');
    }
    return tenant;
  }
}
