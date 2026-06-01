import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { CompanyService } from './company.service';
import { MappingService } from '../mapping/mapping.service';
import { QueueNames } from 'src/common/constants/queue-names';
import { CompanyJobData } from 'src/common/interfaces/job-data.interface';

@Processor(QueueNames.COMPANY_PROCESSING, { concurrency: 10 })
export class CompanyProcessor extends WorkerHost {
  private readonly logger = new Logger(CompanyProcessor.name);

  constructor(
    private companyService: CompanyService,
    private mappingService: MappingService,
  ) {
    super();
  }

  async process(job: Job<CompanyJobData>): Promise<any> {
    const { sourceId, batchId, sourceData, mappings } = job.data;
    const startTime = Date.now();

    try {
      await this.companyService.updateStatus(sourceId, 'processing');
      const mappedData = await this.mappingService.applyMappingsToData('company', sourceData, mappings);
      await this.companyService.upsertCompany(sourceId, mappedData, batchId);
      await this.companyService.updateStatus(sourceId, 'completed');
      return { success: true, sourceId, batchId, duration_ms: Date.now() - startTime };
    } catch (error: any) {
      await this.companyService.updateStatus(sourceId, 'failed', error.message);
      throw error;
    }
  }
}
