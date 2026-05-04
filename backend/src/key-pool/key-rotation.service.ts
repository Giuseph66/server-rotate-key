import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';

export interface SelectedKey {
  id: string;
  label: string;
  key: string;
}

@Injectable()
export class KeyRotationService {
  private readonly logger = new Logger(KeyRotationService.name);
  private roundRobinIndex = 0;

  constructor(private prisma: PrismaService) {}

  /**
   * Select the next available key from the pool.
   * Strategy: round-robin or least-used based on settings.
   * Optionally prioritize a specific tenant's key.
   */
  async selectKey(tenantId?: string): Promise<SelectedKey | null> {
    const settings = await this.prisma.settings.findUnique({ where: { id: 'global' } });
    const strategy = settings?.rotationStrategy || 'round-robin';
    const now = new Date();

    // First, auto-expire any cooled-down keys
    await this.prisma.apiKey.updateMany({
      where: {
        status: 'COOLING_DOWN',
        cooldownUntil: { lte: now },
      },
      data: { status: 'ACTIVE', cooldownUntil: null },
    });

    // If tenant has a specific key, try that first
    if (tenantId) {
      const tenantKey = await this.prisma.apiKey.findFirst({
        where: {
          tenantId,
          isActive: true,
          status: 'ACTIVE',
        },
      });
      if (tenantKey) {
        return { id: tenantKey.id, label: tenantKey.label, key: tenantKey.key };
      }
    }

    // Get all available keys
    const availableKeys = await this.prisma.apiKey.findMany({
      where: {
        isActive: true,
        status: 'ACTIVE',
      },
      orderBy: strategy === 'least-used'
        ? { totalRequests: 'asc' }
        : { createdAt: 'asc' },
    });

    if (availableKeys.length === 0) {
      return null;
    }

    if (strategy === 'least-used') {
      const selected = availableKeys[0];
      return { id: selected.id, label: selected.label, key: selected.key };
    }

    // Round-robin
    this.roundRobinIndex = this.roundRobinIndex % availableKeys.length;
    const selected = availableKeys[this.roundRobinIndex];
    this.roundRobinIndex++;
    return { id: selected.id, label: selected.label, key: selected.key };
  }

  /**
   * Select the next available key, excluding specific key IDs (already tried).
   */
  async selectKeyExcluding(excludeIds: string[], tenantId?: string): Promise<SelectedKey | null> {
    const now = new Date();

    // Auto-expire cooldowns
    await this.prisma.apiKey.updateMany({
      where: {
        status: 'COOLING_DOWN',
        cooldownUntil: { lte: now },
      },
      data: { status: 'ACTIVE', cooldownUntil: null },
    });

    const availableKeys = await this.prisma.apiKey.findMany({
      where: {
        isActive: true,
        status: 'ACTIVE',
        id: { notIn: excludeIds },
      },
      orderBy: { totalRequests: 'asc' },
    });

    if (availableKeys.length === 0) return null;

    const selected = availableKeys[0];
    return { id: selected.id, label: selected.label, key: selected.key };
  }

  /**
   * Mark a key as cooling down after a 429 error.
   */
  async markCoolingDown(keyId: string): Promise<void> {
    const settings = await this.prisma.settings.findUnique({ where: { id: 'global' } });
    const cooldownMinutes = settings?.cooldownMinutes || 5;

    const cooldownUntil = new Date(Date.now() + cooldownMinutes * 60 * 1000);
    await this.prisma.apiKey.update({
      where: { id: keyId },
      data: {
        status: 'COOLING_DOWN',
        cooldownUntil,
        errorCount429: { increment: 1 },
      },
    });

    this.logger.warn(`🔥 Key ${keyId} marked as COOLING_DOWN until ${cooldownUntil.toISOString()}`);
  }

  /**
   * Record successful usage of a key.
   */
  async recordUsage(keyId: string): Promise<void> {
    await this.prisma.apiKey.update({
      where: { id: keyId },
      data: {
        totalRequests: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });
  }

  /**
   * Cron job: automatically expire cooldowns every minute.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleCooldownExpiry() {
    const now = new Date();
    const result = await this.prisma.apiKey.updateMany({
      where: {
        status: 'COOLING_DOWN',
        cooldownUntil: { lte: now },
      },
      data: { status: 'ACTIVE', cooldownUntil: null },
    });

    if (result.count > 0) {
      this.logger.log(`♻️ ${result.count} key(s) returned to ACTIVE from cooldown`);
    }
  }
}
