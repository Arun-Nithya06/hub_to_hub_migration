import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertyMapping } from '../../common/entities/property-mapping.entity';
import { MappingService } from './mapping.service';

@Module({
  imports: [TypeOrmModule.forFeature([PropertyMapping])],
  providers: [MappingService],
  exports: [MappingService],
})
export class MappingModule {}
