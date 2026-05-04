import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_SECRET || 'ollama-pool-gateway-secret-key-2024',
    });
  }

  async validate(payload: { sub: string; name: string; role: string }) {
    const tenant = await this.authService.validateTenant(payload.sub);
    return { id: tenant.id, name: tenant.name, role: tenant.role };
  }
}
