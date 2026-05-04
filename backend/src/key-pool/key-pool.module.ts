import { Module } from '@nestjs/common';
import { KeyPoolService } from './key-pool.service';
import { KeyPoolController } from './key-pool.controller';
import { KeyRotationService } from './key-rotation.service';

@Module({
  controllers: [KeyPoolController],
  providers: [KeyPoolService, KeyRotationService],
  exports: [KeyPoolService, KeyRotationService],
})
export class KeyPoolModule {}
