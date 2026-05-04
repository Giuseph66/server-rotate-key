import { PrismaService } from '../database/prisma.service';
import { KeyRotationService } from '../key-pool/key-rotation.service';
import { UsageService } from '../usage/usage.service';
export interface ProxyResult {
    success: boolean;
    data?: any;
    statusCode: number;
    retryCount: number;
    keysUsed: {
        id: string;
        label: string;
        result: string;
    }[];
    latencyMs: number;
}
export declare class GatewayService {
    private prisma;
    private keyRotation;
    private usageService;
    private readonly logger;
    constructor(prisma: PrismaService, keyRotation: KeyRotationService, usageService: UsageService);
    proxyRequest(endpoint: string, body: any, tenantId?: string): Promise<ProxyResult>;
    proxyStreamRequest(endpoint: string, body: any, tenantId?: string): Promise<{
        stream: ReadableStream;
        keysUsed: {
            id: string;
            label: string;
            result: string;
        }[];
    }>;
    listModels(tenantId?: string): Promise<any>;
    getSettings(): Promise<{
        id: string;
        cooldownMinutes: number;
        maxRetries: number;
        rotationStrategy: string;
        ollamaBaseUrl: string;
    } | null>;
    updateSettings(data: {
        cooldownMinutes?: number;
        maxRetries?: number;
        rotationStrategy?: string;
        ollamaBaseUrl?: string;
    }): Promise<{
        id: string;
        cooldownMinutes: number;
        maxRetries: number;
        rotationStrategy: string;
        ollamaBaseUrl: string;
    }>;
}
