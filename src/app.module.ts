import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { databaseConfig } from './common/config';
import { QueueNames } from './common/constants/queue-names';
import { BatchModule, AssociationModule, QueueModule, MappingModule, ExportModule } from './modules';
import { HubspotModule } from './libs/hubspot/hubspot.module';
import { EmailModule, CallModule, MeetingModule, NoteModule, TaskModule } from './modules/engagements';
import { CompanyModule, ContactModule, DealModule } from './modules/objects';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(databaseConfig),
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: 100,
          removeOnFail: 500,
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: QueueNames.BATCH_PROCESSING },
      { name: QueueNames.CONTACT_PROCESSING },
      { name: QueueNames.COMPANY_PROCESSING },
      { name: QueueNames.DEAL_PROCESSING },
      { name: QueueNames.EMAIL_PROCESSING },
      { name: QueueNames.CALL_PROCESSING },
      { name: QueueNames.MEETING_PROCESSING },
      { name: QueueNames.TASK_PROCESSING },
      { name: QueueNames.NOTE_PROCESSING },
      { name: QueueNames.ASSOCIATION_PROCESSING },
      { name: QueueNames.TRACKING_QUEUE },
    ),
    BatchModule,
    ContactModule,
    CompanyModule,
    DealModule,
    AssociationModule,
    MappingModule,
    QueueModule,
    HubspotModule,
    EmailModule,
    CallModule,
    MeetingModule,
    TaskModule,
    NoteModule,
    ExportModule,
  ],
})
export class AppModule {}
