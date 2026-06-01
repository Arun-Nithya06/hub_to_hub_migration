import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from '../../common/entities/company.entity';
import { CompanyService } from './company.service';
import { CompanyProcessor } from './company.processor';
import { MappingModule } from '../mapping/mapping.module';

@Module({
  imports: [TypeOrmModule.forFeature([Company]), MappingModule],
  providers: [CompanyService, CompanyProcessor],
  exports: [CompanyService],
})
export class CompanyModule {}
