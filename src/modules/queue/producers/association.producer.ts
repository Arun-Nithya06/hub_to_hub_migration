import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueNames } from 'src/common/constants/queue-names';
import { AssociationJobData } from 'src/common/interfaces/job-data.interface';

@Injectable()
export class AssociationProducer {
  constructor(@InjectQueue(QueueNames.ASSOCIATION_PROCESSING) private associationQueue: Queue) {}

  async addJob(data: AssociationJobData): Promise<string> {
    const job = await this.associationQueue.add('process-association', data, {
      jobId: `assoc-${data.fromSourceId}-${data.toSourceId}-${data.batchId}`,
      priority: 3,
      delay: 1000,
    });
    return job.id as string;
  }
}
