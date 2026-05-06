import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ChatGPTAuthService } from './chatgpt-auth.service';
import { ChatGPTAuthController } from './chatgpt-auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { GatewayAuthGuard } from './gateway-auth.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'ollama-pool-gateway-secret-key-2024',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AuthController, ChatGPTAuthController],
  providers: [AuthService, ChatGPTAuthService, JwtStrategy, JwtAuthGuard, RolesGuard, GatewayAuthGuard],
  exports: [AuthService, ChatGPTAuthService, JwtAuthGuard, RolesGuard, GatewayAuthGuard, JwtModule],
})
export class AuthModule {}
