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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcryptjs");
const prisma_service_1 = require("../database/prisma.service");
let AuthService = class AuthService {
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async login(identifier, password) {
        const tenant = await this.prisma.tenant.findFirst({
            where: {
                OR: [
                    { name: identifier },
                    { email: identifier },
                ],
            },
        });
        if (!tenant || !tenant.isActive) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(password, tenant.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
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
    async validateTenant(id) {
        const tenant = await this.prisma.tenant.findUnique({ where: { id } });
        if (!tenant || !tenant.isActive) {
            throw new common_1.UnauthorizedException('Tenant not found or inactive');
        }
        return tenant;
    }
    async getProfile(id) {
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
        if (!tenant)
            throw new common_1.UnauthorizedException('Tenant not found');
        return tenant;
    }
    async generateSystemApiKey(id) {
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
    async updateDefaultModel(id, model) {
        return this.prisma.tenant.update({
            where: { id },
            data: { defaultModel: model },
            select: { defaultModel: true },
        });
    }
    async updatePassword(id, currentPass, newPass) {
        const tenant = await this.prisma.tenant.findUnique({ where: { id } });
        if (!tenant)
            throw new common_1.UnauthorizedException('Tenant not found');
        const isMatch = await bcrypt.compare(currentPass, tenant.password);
        if (!isMatch)
            throw new common_1.UnauthorizedException('Invalid current password');
        const hashedPassword = await bcrypt.hash(newPass, 10);
        await this.prisma.tenant.update({
            where: { id },
            data: { password: hashedPassword },
        });
        return { message: 'Password updated successfully' };
    }
    async register(name, email, password) {
        const existing = await this.prisma.tenant.findUnique({ where: { name } });
        if (existing) {
            throw new common_1.UnauthorizedException('Username already taken');
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map