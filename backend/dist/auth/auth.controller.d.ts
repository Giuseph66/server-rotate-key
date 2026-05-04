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
}
