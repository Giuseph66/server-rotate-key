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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantsService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = require("bcryptjs");
const prisma_service_1 = require("../database/prisma.service");
let TenantsService = class TenantsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
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
    async findOne(id) {
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
        if (!tenant)
            throw new common_1.NotFoundException('Tenant not found');
        return tenant;
    }
    async create(data) {
        const existing = await this.prisma.tenant.findUnique({ where: { name: data.name } });
        if (existing)
            throw new common_1.ConflictException('Tenant name already exists');
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
    async update(id, data) {
        await this.findOne(id);
        const updateData = { ...data };
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
    async remove(id) {
        await this.findOne(id);
        await this.prisma.tenant.delete({ where: { id } });
        return { message: 'Tenant deleted' };
    }
};
exports.TenantsService = TenantsService;
exports.TenantsService = TenantsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TenantsService);
//# sourceMappingURL=tenants.service.js.map