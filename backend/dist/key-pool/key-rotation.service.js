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
var KeyRotationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyRotationService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../database/prisma.service");
let KeyRotationService = KeyRotationService_1 = class KeyRotationService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(KeyRotationService_1.name);
        this.roundRobinIndex = 0;
    }
    async selectKey(tenantId) {
        const settings = await this.prisma.settings.findUnique({ where: { id: 'global' } });
        const strategy = settings?.rotationStrategy || 'round-robin';
        const now = new Date();
        await this.prisma.apiKey.updateMany({
            where: {
                status: 'COOLING_DOWN',
                cooldownUntil: { lte: now },
            },
            data: { status: 'ACTIVE', cooldownUntil: null },
        });
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
        this.roundRobinIndex = this.roundRobinIndex % availableKeys.length;
        const selected = availableKeys[this.roundRobinIndex];
        this.roundRobinIndex++;
        return { id: selected.id, label: selected.label, key: selected.key };
    }
    async selectKeyExcluding(excludeIds, tenantId) {
        const now = new Date();
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
        if (availableKeys.length === 0)
            return null;
        const selected = availableKeys[0];
        return { id: selected.id, label: selected.label, key: selected.key };
    }
    async markCoolingDown(keyId) {
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
    async recordUsage(keyId) {
        await this.prisma.apiKey.update({
            where: { id: keyId },
            data: {
                totalRequests: { increment: 1 },
                lastUsedAt: new Date(),
            },
        });
    }
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
};
exports.KeyRotationService = KeyRotationService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], KeyRotationService.prototype, "handleCooldownExpiry", null);
exports.KeyRotationService = KeyRotationService = KeyRotationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], KeyRotationService);
//# sourceMappingURL=key-rotation.service.js.map