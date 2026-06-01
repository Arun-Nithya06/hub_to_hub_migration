import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EmailJobData } from 'src/common/interfaces/job-data.interface';
import { QueueNames } from 'src/common/constants/queue-names';

@Injectable()
export class EmailProducer {
  constructor(@InjectQueue(QueueNames.EMAIL_PROCESSING) private emailQueue: Queue) {}

  async addJob(data: EmailJobData): Promise<string> {
    const job = await this.emailQueue.add('process-email', data, {
      jobId: `email-${data.emailId}-${data.batchId}`,
      priority: 2,
    });
    return job.id as string;
  }
}
