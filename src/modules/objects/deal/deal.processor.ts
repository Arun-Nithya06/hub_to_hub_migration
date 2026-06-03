import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { DealService } from './deal.service';
import { QueueNames } from 'src/common/constants/queue-names';
import { DealJobData } from 'src/common/interfaces/job-data.interface';
import { MappingService } from 'src/modules/mapping/mapping.service';

@Processor(QueueNames.DEAL_PROCESSING, { concurrency: 10 })
export class DealProcessor extends WorkerHost {
  private readonly logger = new Logger(DealProcessor.name);

  constructor(
    private dealService: DealService,
    private mappingService: MappingService,
  ) {
    super();
  }

  async process(job: Job<DealJobData>): Promise<any> {
    const { sourceId, batchId, sourceData, mappings } = job.data;
    const startTime = Date.now();

    try {
      await this.dealService.updateStatus(sourceId, 'processing');
      const mappedData = await this.mappingService.applyMappingsToData('deal', sourceData, mappings);
      await this.dealService.upsertDeal(sourceId, mappedData, batchId);
      await this.dealService.updateStatus(sourceId, 'completed');
      return { success: true, sourceId, batchId, duration_ms: Date.now() - startTime };
    } catch (error: any) {
      await this.dealService.updateStatus(sourceId, 'failed', error.message);
      throw error;
    }
  }
}
