import { PrismaService } from '../database/prisma.service';
export declare class TenantsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: string;
        name: string;
        email: string | null;
        role: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        _count: {
            apiKeys: number;
            usageLogs: number;
        };
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        name: string;
        email: string | null;
        role: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        _count: {
            apiKeys: number;
            usageLogs: number;
        };
    }>;
    create(data: {
        name: string;
        email?: string;
        password: string;
        role?: string;
    }): Promise<{
        id: string;
        name: string;
        email: string | null;
        role: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, data: {
        name?: string;
        email?: string;
        password?: string;
        role?: string;
        isActive?: boolean;
    }): Promise<{
        id: string;
        name: string;
        email: string | null;
        role: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
