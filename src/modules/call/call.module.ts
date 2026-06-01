import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Call } from '../../common/entities/call.entity';
import { CallService } from './call.service';
import { CallProcessor } from './call.processor';

@Module({
  imports: [TypeOrmModule.forFeature([Call])],
  providers: [CallService, CallProcessor],
  exports: [CallService],
})
export class CallModule {}
