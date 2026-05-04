import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { apiKeys: true, usageLogs: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { apiKeys: true, usageLogs: true } },
      },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async create(data: { name: string; email?: string; password: string; role?: string }) {
    const existing = await this.prisma.tenant.findUnique({ where: { name: data.name } });
    if (existing) throw new ConflictException('Tenant name already exists');

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const tenant = await this.prisma.tenant.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role || 'user',
      },
    });
    const { password, ...result } = tenant;
    return result;
  }

  async update(id: string, data: { name?: string; email?: string; password?: string; role?: string; isActive?: boolean }) {
    await this.findOne(id);
    const updateData: any = { ...data };
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }
    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: updateData,
    });
    const { password, ...result } = tenant;
    return result;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.tenant.delete({ where: { id } });
    return { message: 'Tenant deleted' };
  }
}
