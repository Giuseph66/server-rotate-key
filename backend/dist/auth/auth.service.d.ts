import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    login(name: string, password: string): Promise<{
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
    }>;
}
