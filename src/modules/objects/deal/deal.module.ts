import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DealService } from './deal.service';
import { DealProcessor } from './deal.processor';
import { MappingModule } from 'src/modules/mapping/mapping.module';
import { Deal } from 'src/common/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Deal]), MappingModule],
  providers: [DealService, DealProcessor],
  exports: [DealService],
})
export class DealModule {}
