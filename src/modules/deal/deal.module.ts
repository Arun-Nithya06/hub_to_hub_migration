import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Deal } from '../../common/entities/deal.entity';
import { DealService } from './deal.service';
import { DealProcessor } from './deal.processor';
import { MappingModule } from '../mapping/mapping.module';

@Module({
  imports: [TypeOrmModule.forFeature([Deal]), MappingModule],
  providers: [DealService, DealProcessor],
  exports: [DealService],
})
export class DealModule {}
