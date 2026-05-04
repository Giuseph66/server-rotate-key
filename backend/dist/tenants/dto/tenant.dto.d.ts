export declare class CreateTenantDto {
    name: string;
    email?: string;
    password: string;
    role?: string;
}
export declare class UpdateTenantDto {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
    isActive?: boolean;
}
