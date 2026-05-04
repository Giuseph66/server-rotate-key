import { PrismaService } from '../database/prisma.service';
export interface SelectedKey {
    id: string;
    label: string;
    key: string;
}
export declare class KeyRotationService {
    private prisma;
    private readonly logger;
    private roundRobinIndex;
    constructor(prisma: PrismaService);
    selectKey(tenantId?: string): Promise<SelectedKey | null>;
    selectKeyExcluding(excludeIds: string[], tenantId?: string): Promise<SelectedKey | null>;
    markCoolingDown(keyId: string): Promise<void>;
    recordUsage(keyId: string): Promise<void>;
    handleCooldownExpiry(): Promise<void>;
}
