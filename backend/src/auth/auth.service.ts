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

  async login(identifier: string, password: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: {
        OR: [
          { name: identifier },
          { email: identifier },
        ],
      },
    });
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

  async getProfile(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        systemApiKey: true,
        defaultModel: true,
        isActive: true,
        createdAt: true,
      },
    });
    if (!tenant) throw new UnauthorizedException('Tenant not found');
    return tenant;
  }

  async generateSystemApiKey(id: string) {
    console.log(`🔑 Generating system API key for tenant ID: ${id}`);
    const apiKey = `sk-${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    const updated = await this.prisma.tenant.update({
      where: { id },
      data: { systemApiKey: apiKey },
      select: { systemApiKey: true },
    });
    console.log(`✅ Key generated successfully for ${id}`);
    return updated;
  }

  async updateDefaultModel(id: string, model: string) {
    return this.prisma.tenant.update({
      where: { id },
      data: { defaultModel: model },
      select: { defaultModel: true },
    });
  }

  async updatePassword(id: string, currentPass: string, newPass: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new UnauthorizedException('Tenant not found');

    const isMatch = await bcrypt.compare(currentPass, tenant.password);
    if (!isMatch) throw new UnauthorizedException('Invalid current password');

    const hashedPassword = await bcrypt.hash(newPass, 10);
    await this.prisma.tenant.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return { message: 'Password updated successfully' };
  }

  async register(name: string, email: string, password: string) {
    const existing = await this.prisma.tenant.findUnique({ where: { name } });
    if (existing) {
      throw new UnauthorizedException('Username already taken');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await this.prisma.tenant.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'user',
        isActive: true,
      },
    });

    return this.login(name, password);
  }
}
