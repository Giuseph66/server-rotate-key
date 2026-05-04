import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class KeyPoolService {
  private readonly logger = new Logger(KeyPoolService.name);

  constructor(private prisma: PrismaService) {}

  async findAll() {
    const keys = await this.prisma.apiKey.findMany({
      include: { tenant: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    // Auto-expire cooldowns
    const now = new Date();
    for (const key of keys) {
      if (key.status === 'COOLING_DOWN' && key.cooldownUntil && key.cooldownUntil <= now) {
        await this.prisma.apiKey.update({
          where: { id: key.id },
          data: { status: 'ACTIVE', cooldownUntil: null },
        });
        key.status = 'ACTIVE';
        key.cooldownUntil = null;
      }
    }

    return keys;
  }

  async findOne(id: string) {
    const key = await this.prisma.apiKey.findUnique({
      where: { id },
      include: { tenant: { select: { id: true, name: true } } },
    });
    if (!key) throw new NotFoundException('API Key not found');
    return key;
  }

  async create(data: { label: string; key: string; tenantId?: string }) {
    return this.prisma.apiKey.create({ data });
  }

  async update(id: string, data: { label?: string; key?: string; isActive?: boolean; tenantId?: string }) {
    await this.findOne(id);
    return this.prisma.apiKey.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.apiKey.delete({ where: { id } });
    return { message: 'API Key deleted' };
  }

  async toggleActive(id: string) {
    const key = await this.findOne(id);
    return this.prisma.apiKey.update({
      where: { id },
      data: { isActive: !key.isActive },
    });
  }

  async getPoolStatus() {
    const allKeys = await this.prisma.apiKey.findMany();
    const now = new Date();

    // Auto-expire cooldowns
    for (const key of allKeys) {
      if (key.status === 'COOLING_DOWN' && key.cooldownUntil && key.cooldownUntil <= now) {
        await this.prisma.apiKey.update({
          where: { id: key.id },
          data: { status: 'ACTIVE', cooldownUntil: null },
        });
        key.status = 'ACTIVE';
      }
    }

    const active = allKeys.filter(k => k.status === 'ACTIVE' && k.isActive);
    const coolingDown = allKeys.filter(k => k.status === 'COOLING_DOWN');
    const disabled = allKeys.filter(k => !k.isActive);

    return {
      total: allKeys.length,
      active: active.length,
      coolingDown: coolingDown.length,
      disabled: disabled.length,
      keys: allKeys.map(k => ({
        id: k.id,
        label: k.label,
        status: k.status,
        isActive: k.isActive,
        cooldownUntil: k.cooldownUntil,
        errorCount429: k.errorCount429,
        totalRequests: k.totalRequests,
        lastUsedAt: k.lastUsedAt,
        lastTestedAt: k.lastTestedAt,
        lastTestResult: k.lastTestResult,
      })),
    };
  }

  async testKey(id: string) {
    const key = await this.findOne(id);
    const settings = await this.prisma.settings.findUnique({ where: { id: 'global' } });
    const baseUrl = settings?.ollamaBaseUrl || 'https://ollama.com';

    try {
      const response = await fetch(`${baseUrl}/api/tags`, {
        headers: { Authorization: `Bearer ${key.key}` },
        signal: AbortSignal.timeout(10000),
      });

      const result = response.ok ? 'SUCCESS' : 'FAILED';
      await this.prisma.apiKey.update({
        where: { id },
        data: { lastTestedAt: new Date(), lastTestResult: result },
      });

      return { id, label: key.label, result, statusCode: response.status };
    } catch (error) {
      await this.prisma.apiKey.update({
        where: { id },
        data: { lastTestedAt: new Date(), lastTestResult: 'FAILED' },
      });
      return { id, label: key.label, result: 'FAILED', error: error.message };
    }
  }

  async testAllKeys() {
    const keys = await this.prisma.apiKey.findMany({ where: { isActive: true } });
    const results: any[] = [];
    for (const key of keys) {
      const result = await this.testKey(key.id);
      results.push(result);
    }
    return results;
  }
}
