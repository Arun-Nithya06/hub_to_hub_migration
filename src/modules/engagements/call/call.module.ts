import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Call } from 'src/common/entities';
import { CallService } from './call.service';
import { CallProcessor } from './call.processor';

@Module({
  imports: [TypeOrmModule.forFeature([Call])],
  providers: [CallService, CallProcessor],
  exports: [CallService],
})
export class CallModule {}
