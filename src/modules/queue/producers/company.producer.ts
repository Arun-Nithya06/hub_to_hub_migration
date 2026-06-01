import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueNames } from 'src/common/constants/queue-names';
import { CompanyJobData } from 'src/common/interfaces/job-data.interface';

@Injectable()
export class CompanyProducer {
  constructor(@InjectQueue(QueueNames.COMPANY_PROCESSING) private companyQueue: Queue) {}

  async addJob(data: CompanyJobData): Promise<string> {
    const job = await this.companyQueue.add('process-company', data, {
      jobId: `company-${data.sourceId}-${data.batchId}`,
      priority: 1,
    });
    return job.id as string;
  }
}
