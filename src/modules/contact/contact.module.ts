import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact } from '../../common/entities/contact.entity';
import { ContactService } from './contact.service';
import { ContactProcessor } from './contact.processor';
import { ContactController } from './contact.controller';
import { QueueModule } from '../queue/queue.module';
import { MappingModule } from '../mapping/mapping.module';
import { HubspotModule } from 'src/libs/hubspot/hubspot.module';

@Module({
  imports: [TypeOrmModule.forFeature([Contact]), QueueModule, MappingModule, HubspotModule],
  providers: [ContactService, ContactProcessor],
  controllers: [ContactController],
  exports: [ContactService],
})
export class ContactModule {}
