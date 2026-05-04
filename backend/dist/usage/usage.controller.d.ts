import { UsageService } from './usage.service';
export declare class UsageController {
    private usageService;
    constructor(usageService: UsageService);
    getRecentLogs(limit?: string): Promise<({
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
