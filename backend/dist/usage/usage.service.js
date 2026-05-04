"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var UsageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsageService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
let UsageService = UsageService_1 = class UsageService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(UsageService_1.name);
    }
    async logUsage(params) {
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
        }
        catch (error) {
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
        const totalRequests = await this.prisma.usageLog.count();
        const requests24h = await this.prisma.usageLog.count({
            where: { createdAt: { gte: oneDayAgo } },
        });
        const requestsLastHour = await this.prisma.usageLog.count({
            where: { createdAt: { gte: oneHourAgo } },
        });
        const successRequests24h = await this.prisma.usageLog.count({
            where: {
                createdAt: { gte: oneDayAgo },
                status: { in: ['SUCCESS', 'RETRIED'] },
            },
        });
        const avgLatency = await this.prisma.usageLog.aggregate({
            _avg: { latencyMs: true },
            where: {
                createdAt: { gte: oneDayAgo },
                status: { in: ['SUCCESS', 'RETRIED'] },
            },
        });
        const totalRetries = await this.prisma.usageLog.aggregate({
            _sum: { retryCount: true },
            where: { createdAt: { gte: oneDayAgo } },
        });
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
        const logsLast24h = await this.prisma.usageLog.findMany({
            where: { createdAt: { gte: oneDayAgo } },
            select: { createdAt: true, status: true },
            orderBy: { createdAt: 'asc' },
        });
        const requestsPerHour = [];
        for (let i = 23; i >= 0; i--) {
            const hourStart = new Date(now.getTime() - i * 60 * 60 * 1000);
            const hourEnd = new Date(now.getTime() - (i - 1) * 60 * 60 * 1000);
            const hourLogs = logsLast24h.filter((l) => l.createdAt >= hourStart && l.createdAt < hourEnd);
            requestsPerHour.push({
                hour: hourStart.toISOString().slice(11, 16),
                count: hourLogs.length,
                success: hourLogs.filter((l) => l.status === 'SUCCESS' || l.status === 'RETRIED').length,
                failed: hourLogs.filter((l) => l.status === 'FAILED').length,
            });
        }
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
};
exports.UsageService = UsageService;
exports.UsageService = UsageService = UsageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsageService);
//# sourceMappingURL=usage.service.js.map