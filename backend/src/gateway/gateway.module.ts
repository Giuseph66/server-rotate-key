import { Module } from '@nestjs/common';
import { GatewayService } from './gateway.service';
import { GatewayController } from './gateway.controller';
import { KeyPoolModule } from '../key-pool/key-pool.module';
import { UsageModule } from '../usage/usage.module';

@Module({
  imports: [KeyPoolModule, UsageModule],
  controllers: [GatewayController],
  providers: [GatewayService],
})
export class GatewayModule {}
