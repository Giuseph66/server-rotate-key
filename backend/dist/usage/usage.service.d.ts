import { PrismaService } from '../database/prisma.service';
interface LogUsageParams {
    tenantId?: string;
    apiKeyId?: string;
    apiKeyLabel?: string;
    endpoint: string;
    model?: string;
    status: string;
    statusCode?: number;
    latencyMs: number;
    tokensInput?: number;
    tokensOutput?: number;
    retryCount?: number;
    errorMessage?: string;
    requestBody?: string;
    responseBody?: string;
}
export declare class UsageService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    logUsage(params: LogUsageParams): Promise<{
        id: string;
        createdAt: Date;
        requestBody: string | null;
        model: string | null;
        status: string;
        tenantId: string | null;
        statusCode: number | null;
        apiKeyLabel: string | null;
        endpoint: string;
        latencyMs: number;
        tokensInput: number | null;
        tokensOutput: number | null;
        retryCount: number;
        errorMessage: string | null;
        responseBody: string | null;
        apiKeyId: string | null;
    } | undefined>;
    getRecentLogs(limit?: number): Promise<({
        tenant: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        requestBody: string | null;
        model: string | null;
        status: string;
        tenantId: string | null;
        statusCode: number | null;
        apiKeyLabel: string | null;
        endpoint: string;
        latencyMs: number;
        tokensInput: number | null;
        tokensOutput: number | null;
        retryCount: number;
        errorMessage: string | null;
        responseBody: string | null;
        apiKeyId: string | null;
    })[]>;
    getStats(): Promise<{
        totalRequests: number;
        requests24h: number;
        requestsLastHour: number;
        successRate24h: number;
        avgLatencyMs: number;
        totalRetries24h: number;
        topModels: {
            model: string | null;
            count: number;
        }[];
        requestsPerHour: {
            hour: string;
            count: number;
            success: number;
            failed: number;
        }[];
        usageByTenant: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.UsageLogGroupByOutputType, "tenantId"[]> & {
            _count: {
                id: number;
            };
        })[];
    }>;
}
export {};
