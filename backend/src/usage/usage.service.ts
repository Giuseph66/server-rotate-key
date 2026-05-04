import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

interface LogUsageParams {
  tenantId?: string;
  apiKeyId?: string;
  apiKeyLabel?: string;
  endpoint: string;
  model?: string;
  status: string;
  statusCode?: number;
  latencyMs: number;
  tokensInput?: number;
  tokensOutput?: number;
  retryCount?: number;
  errorMessage?: string;
  requestBody?: string;
  responseBody?: string;
}

@Injectable()
export class UsageService {
  private readonly logger = new Logger(UsageService.name);

  constructor(private prisma: PrismaService) {}

  async logUsage(params: LogUsageParams) {
    try {
      return await this.prisma.usageLog.create({
        data: {
          tenantId: params.tenantId || null,
          apiKeyId: params.apiKeyId || null,
          apiKeyLabel: params.apiKeyLabel || null,
          endpoint: params.endpoint,
          model: params.model || null,
          status: params.status,
          statusCode: params.statusCode || null,
          latencyMs: params.latencyMs,
          tokensInput: params.tokensInput || null,
          tokensOutput: params.tokensOutput || null,
          retryCount: params.retryCount || 0,
          errorMessage: params.errorMessage || null,
          requestBody: params.requestBody || null,
          responseBody: params.responseBody || null,
        },
      });
    } catch (error) {
      this.logger.error('Failed to log usage', error);
    }
  }

  async getRecentLogs(limit = 50) {
    return this.prisma.usageLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        tenant: { select: { id: true, name: true } },
      },
    });
  }

  async getStats() {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Total requests
    const totalRequests = await this.prisma.usageLog.count();

    // Requests last 24h
    const requests24h = await this.prisma.usageLog.count({
      where: { createdAt: { gte: oneDayAgo } },
    });

    // Requests last hour
    const requestsLastHour = await this.prisma.usageLog.count({
      where: { createdAt: { gte: oneHourAgo } },
    });

    // Success rate last 24h
    const successRequests24h = await this.prisma.usageLog.count({
      where: {
        createdAt: { gte: oneDayAgo },
        status: { in: ['SUCCESS', 'RETRIED'] },
      },
    });

    // Average latency last 24h
    const avgLatency = await this.prisma.usageLog.aggregate({
      _avg: { latencyMs: true },
      where: {
        createdAt: { gte: oneDayAgo },
        status: { in: ['SUCCESS', 'RETRIED'] },
      },
    });

    // Total retries last 24h
    const totalRetries = await this.prisma.usageLog.aggregate({
      _sum: { retryCount: true },
      where: { createdAt: { gte: oneDayAgo } },
    });

    // Top models
    const topModels = await this.prisma.usageLog.groupBy({
      by: ['model'],
      _count: { model: true },
      where: {
        model: { not: null },
        createdAt: { gte: oneDayAgo },
      },
      orderBy: { _count: { model: 'desc' } },
      take: 10,
    });

    // Requests per hour (last 24h)
    const logsLast24h = await this.prisma.usageLog.findMany({
      where: { createdAt: { gte: oneDayAgo } },
      select: { createdAt: true, status: true },
      orderBy: { createdAt: 'asc' },
    });

    const requestsPerHour: { hour: string; count: number; success: number; failed: number }[] = [];
    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourEnd = new Date(now.getTime() - (i - 1) * 60 * 60 * 1000);
      const hourLogs = logsLast24h.filter(
        (l) => l.createdAt >= hourStart && l.createdAt < hourEnd,
      );
      requestsPerHour.push({
        hour: hourStart.toISOString().slice(11, 16),
        count: hourLogs.length,
        success: hourLogs.filter((l) => l.status === 'SUCCESS' || l.status === 'RETRIED').length,
        failed: hourLogs.filter((l) => l.status === 'FAILED').length,
      });
    }

    // Usage by tenant
    const usageByTenant = await this.prisma.usageLog.groupBy({
      by: ['tenantId'],
      _count: { id: true },
      where: { createdAt: { gte: oneDayAgo } },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    return {
      totalRequests,
      requests24h,
      requestsLastHour,
      successRate24h: requests24h > 0
        ? Math.round((successRequests24h / requests24h) * 100)
        : 100,
      avgLatencyMs: Math.round(avgLatency._avg.latencyMs || 0),
      totalRetries24h: totalRetries._sum.retryCount || 0,
      topModels: topModels.map((m) => ({
        model: m.model,
        count: m._count.model,
      })),
      requestsPerHour,
      usageByTenant,
    };
  }
}
