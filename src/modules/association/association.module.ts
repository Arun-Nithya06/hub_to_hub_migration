import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Association } from '../../common/entities/association.entity';
import { AssociationService } from './association.service';
import { AssociationProcessor } from './association.processor';

@Module({
  imports: [TypeOrmModule.forFeature([Association])],
  providers: [AssociationService, AssociationProcessor],
  exports: [AssociationService],
})
export class AssociationModule {}
