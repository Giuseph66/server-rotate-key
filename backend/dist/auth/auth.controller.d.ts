import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<{
        access_token: string;
        tenant: {
            id: string;
            name: string;
            email: string | null;
            role: string;
        };
    }>;
    getProfile(req: any): Promise<{
        id: string;
        name: string;
        email: string | null;
        role: string;
        isActive: boolean;
        createdAt: Date;
        systemApiKey: string | null;
        defaultModel: string | null;
    }>;
    generateApiKey(req: any): Promise<{
        systemApiKey: string | null;
    }>;
    updateDefaultModel(req: any, model: string): Promise<{
        defaultModel: string | null;
    }>;
    updatePassword(req: any, body: any): Promise<{
        message: string;
    }>;
    register(body: any): Promise<{
        access_token: string;
        tenant: {
            id: string;
            name: string;
            email: string | null;
            role: string;
        };
    }>;
}
