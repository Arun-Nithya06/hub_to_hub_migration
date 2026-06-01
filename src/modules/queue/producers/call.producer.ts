import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueNames } from 'src/common/constants/queue-names';
import { CallJobData } from 'src/common/interfaces/job-data.interface';

@Injectable()
export class CallProducer {
  constructor(@InjectQueue(QueueNames.CALL_PROCESSING) private callQueue: Queue) {}

  async addJob(data: CallJobData): Promise<string> {
    const job = await this.callQueue.add('process-call', data, {
      jobId: `call-${data.callId}-${data.batchId}`,
      priority: 2,
    });
    return job.id as string;
  }
}
