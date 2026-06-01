import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueNames } from 'src/common/constants/queue-names';
import { ContactJobData } from 'src/common/interfaces/job-data.interface';

@Injectable()
export class ContactProducer {
  constructor(@InjectQueue(QueueNames.CONTACT_PROCESSING) private contactQueue: Queue) {}

  async addJob(data: ContactJobData): Promise<string> {
    const job = await this.contactQueue.add('process-contact', data, {
      jobId: `contact-${data.sourceId}-${data.batchId}`,
      priority: 1,
    });
    return job.id as string;
  }
}
