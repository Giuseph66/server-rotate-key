import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { KeyPoolModule } from './key-pool/key-pool.module';
import { GatewayModule } from './gateway/gateway.module';
import { UsageModule } from './usage/usage.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    TenantsModule,
    KeyPoolModule,
    GatewayModule,
    UsageModule,
  ],
})
export class AppModule {}
