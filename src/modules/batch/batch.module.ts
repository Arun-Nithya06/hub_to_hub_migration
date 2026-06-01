import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Batch } from '../../common/entities/batch.entity';
import { BatchService } from './batch.service';
import { BatchController } from './batch.controller';
import { QueueModule } from '../queue/queue.module';
import { MappingModule } from '../mapping/mapping.module';

@Module({
  imports: [TypeOrmModule.forFeature([Batch]), QueueModule, MappingModule],
  providers: [BatchService],
  controllers: [BatchController],
  exports: [BatchService],
})
export class BatchModule {}
