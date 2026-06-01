import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { CallService } from './call.service';
import { QueueNames } from 'src/common/constants/queue-names';
import { CallJobData } from 'src/common/interfaces/job-data.interface';

@Processor(QueueNames.CALL_PROCESSING, { concurrency: 15 })
export class CallProcessor extends WorkerHost {
  private readonly logger = new Logger(CallProcessor.name);

  constructor(private callService: CallService) {
    super();
  }

  async process(job: Job<CallJobData>): Promise<any> {
    const { callId, sourceId, batchId, properties } = job.data;
    const startTime = Date.now();

    try {
      await this.callService.upsertCall(callId, sourceId, batchId, properties);
      return { success: true, callId, duration_ms: Date.now() - startTime };
    } catch (error: any) {
      this.logger.error(`Failed to process call ${callId}: ${error.message}`);
      throw error;
    }
  }
}
