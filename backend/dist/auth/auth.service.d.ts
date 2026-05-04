import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    login(identifier: string, password: string): Promise<{
        access_token: string;
        tenant: {
            id: string;
            name: string;
            email: string | null;
            role: string;
        };
    }>;
    validateTenant(id: string): Promise<{
        id: string;
        name: string;
        email: string | null;
        password: string;
        role: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        systemApiKey: string | null;
        defaultModel: string | null;
    }>;
    getProfile(id: string): Promise<{
        id: string;
        name: string;
        email: string | null;
        role: string;
        isActive: boolean;
        createdAt: Date;
        systemApiKey: string | null;
        defaultModel: string | null;
    }>;
    generateSystemApiKey(id: string): Promise<{
        systemApiKey: string | null;
    }>;
    updateDefaultModel(id: string, model: string): Promise<{
        defaultModel: string | null;
    }>;
    updatePassword(id: string, currentPass: string, newPass: string): Promise<{
        message: string;
    }>;
    register(name: string, email: string, password: string): Promise<{
        access_token: string;
        tenant: {
            id: string;
            name: string;
            email: string | null;
            role: string;
        };
    }>;
}
