export declare class CreateApiKeyDto {
    label: string;
    key: string;
    tenantId?: string;
}
export declare class UpdateApiKeyDto {
    label?: string;
    key?: string;
    isActive?: boolean;
    tenantId?: string;
}
