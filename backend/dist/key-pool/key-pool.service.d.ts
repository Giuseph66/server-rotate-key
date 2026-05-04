import { PrismaService } from '../database/prisma.service';
export declare class KeyPoolService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    findAll(): Promise<({
        tenant: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        label: string;
        key: string;
        status: string;
        cooldownUntil: Date | null;
        errorCount429: number;
        totalRequests: number;
        lastUsedAt: Date | null;
        lastTestedAt: Date | null;
        lastTestResult: string | null;
        tenantId: string | null;
    })[]>;
    findOne(id: string): Promise<{
        tenant: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        label: string;
        key: string;
        status: string;
        cooldownUntil: Date | null;
        errorCount429: number;
        totalRequests: number;
        lastUsedAt: Date | null;
        lastTestedAt: Date | null;
        lastTestResult: string | null;
        tenantId: string | null;
    }>;
    create(data: {
        label: string;
        key: string;
        tenantId?: string;
    }): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        label: string;
        key: string;
        status: string;
        cooldownUntil: Date | null;
        errorCount429: number;
        totalRequests: number;
        lastUsedAt: Date | null;
        lastTestedAt: Date | null;
        lastTestResult: string | null;
        tenantId: string | null;
    }>;
    update(id: string, data: {
        label?: string;
        key?: string;
        isActive?: boolean;
        tenantId?: string;
    }): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        label: string;
        key: string;
        status: string;
        cooldownUntil: Date | null;
        errorCount429: number;
        totalRequests: number;
        lastUsedAt: Date | null;
        lastTestedAt: Date | null;
        lastTestResult: string | null;
        tenantId: string | null;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
    toggleActive(id: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        label: string;
        key: string;
        status: string;
        cooldownUntil: Date | null;
        errorCount429: number;
        totalRequests: number;
        lastUsedAt: Date | null;
        lastTestedAt: Date | null;
        lastTestResult: string | null;
        tenantId: string | null;
    }>;
    getPoolStatus(): Promise<{
        total: number;
        active: number;
        coolingDown: number;
        disabled: number;
        keys: {
            id: string;
            label: string;
            status: string;
            isActive: boolean;
            cooldownUntil: Date | null;
            errorCount429: number;
            totalRequests: number;
            lastUsedAt: Date | null;
            lastTestedAt: Date | null;
            lastTestResult: string | null;
        }[];
    }>;
    testKey(id: string): Promise<{
        id: string;
        label: string;
        result: string;
        statusCode: number;
        error?: undefined;
    } | {
        id: string;
        label: string;
        result: string;
        error: any;
        statusCode?: undefined;
    }>;
    testAllKeys(): Promise<any[]>;
}
