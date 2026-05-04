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
var KeyPoolService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyPoolService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
let KeyPoolService = KeyPoolService_1 = class KeyPoolService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(KeyPoolService_1.name);
    }
    async findAll() {
        const keys = await this.prisma.apiKey.findMany({
            include: { tenant: { select: { id: true, name: true } } },
            orderBy: { createdAt: 'desc' },
        });
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
    async findOne(id) {
        const key = await this.prisma.apiKey.findUnique({
            where: { id },
            include: { tenant: { select: { id: true, name: true } } },
        });
        if (!key)
            throw new common_1.NotFoundException('API Key not found');
        return key;
    }
    async create(data) {
        return this.prisma.apiKey.create({ data });
    }
    async update(id, data) {
        await this.findOne(id);
        return this.prisma.apiKey.update({ where: { id }, data });
    }
    async remove(id) {
        await this.findOne(id);
        await this.prisma.apiKey.delete({ where: { id } });
        return { message: 'API Key deleted' };
    }
    async toggleActive(id) {
        const key = await this.findOne(id);
        return this.prisma.apiKey.update({
            where: { id },
            data: { isActive: !key.isActive },
        });
    }
    async getPoolStatus() {
        const allKeys = await this.prisma.apiKey.findMany();
        const now = new Date();
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
    async testKey(id) {
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
        }
        catch (error) {
            await this.prisma.apiKey.update({
                where: { id },
                data: { lastTestedAt: new Date(), lastTestResult: 'FAILED' },
            });
            return { id, label: key.label, result: 'FAILED', error: error.message };
        }
    }
    async testAllKeys() {
        const keys = await this.prisma.apiKey.findMany({ where: { isActive: true } });
        const results = [];
        for (const key of keys) {
            const result = await this.testKey(key.id);
            results.push(result);
        }
        return results;
    }
};
exports.KeyPoolService = KeyPoolService;
exports.KeyPoolService = KeyPoolService = KeyPoolService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], KeyPoolService);
//# sourceMappingURL=key-pool.service.js.map