import { Module } from '@nestjs/common';
import { GatewayService } from './gateway.service';
import { GatewayController } from './gateway.controller';
import { KeyPoolModule } from '../key-pool/key-pool.module';
import { UsageModule } from '../usage/usage.module';
import { AuthModule } from '../auth/auth.module';
import { CodexService } from './codex.service';

@Module({
  imports: [KeyPoolModule, UsageModule, AuthModule],
  controllers: [GatewayController],
  providers: [GatewayService, CodexService],
})
export class GatewayModule {}
