import { TenantsService } from './tenants.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';
export declare class TenantsController {
    private tenantsService;
    constructor(tenantsService: TenantsService);
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
    create(dto: CreateTenantDto): Promise<{
        id: string;
        name: string;
        email: string | null;
        role: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, dto: UpdateTenantDto): Promise<{
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
