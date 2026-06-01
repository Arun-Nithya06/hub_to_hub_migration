import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueNames } from 'src/common/constants/queue-names';
import { DealJobData } from 'src/common/interfaces/job-data.interface';

@Injectable()
export class DealProducer {
  constructor(@InjectQueue(QueueNames.DEAL_PROCESSING) private dealQueue: Queue) {}

  async addJob(data: DealJobData): Promise<string> {
    const job = await this.dealQueue.add('process-deal', data, {
      jobId: `deal-${data.sourceId}-${data.batchId}`,
      priority: 1,
    });
    return job.id as string;
  }
}
