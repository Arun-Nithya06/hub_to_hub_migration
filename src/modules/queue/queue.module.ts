import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueService } from './queue.service';
import { QueueNames } from 'src/common/constants/queue-names';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: QueueNames.CONTACT_PROCESSING },
      { name: QueueNames.COMPANY_PROCESSING },
      { name: QueueNames.DEAL_PROCESSING },
      { name: QueueNames.EMAIL_PROCESSING },
      { name: QueueNames.CALL_PROCESSING },
      { name: QueueNames.MEETING_PROCESSING },
      { name: QueueNames.TASK_PROCESSING },
      { name: QueueNames.NOTE_PROCESSING },
      { name: QueueNames.ASSOCIATION_PROCESSING },
    ),
  ],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
