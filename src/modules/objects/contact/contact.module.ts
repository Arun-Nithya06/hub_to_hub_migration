import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ContactService } from './contact.service';
import { ContactProcessor } from './contact.processor';
import { ContactController } from './contact.controller';

import { HubspotModule } from 'src/libs/hubspot/hubspot.module';
import { Contact } from 'src/common/entities';
import { MappingModule, QueueModule } from 'src/modules';

@Module({
  imports: [TypeOrmModule.forFeature([Contact]), QueueModule, MappingModule, HubspotModule],
  providers: [ContactService, ContactProcessor],
  controllers: [ContactController],
  exports: [ContactService],
})
export class ContactModule {}
