import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from 'src/common/entities';
import { CompanyService } from './company.service';
import { CompanyProcessor } from './company.processor';
import { MappingModule } from 'src/modules/mapping/mapping.module';

@Module({
  imports: [TypeOrmModule.forFeature([Company]), MappingModule],
  providers: [CompanyService, CompanyProcessor],
  exports: [CompanyService],
})
export class CompanyModule {}
