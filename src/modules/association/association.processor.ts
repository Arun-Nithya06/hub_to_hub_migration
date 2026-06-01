import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { AssociationService } from './association.service';
import { QueueNames } from 'src/common/constants/queue-names';
import { AssociationJobData } from 'src/common/interfaces/job-data.interface';

@Processor(QueueNames.ASSOCIATION_PROCESSING, { concurrency: 20 })
export class AssociationProcessor extends WorkerHost {
  private readonly logger = new Logger(AssociationProcessor.name);

  constructor(private associationService: AssociationService) {
    super();
  }

  async process(job: Job<AssociationJobData>): Promise<any> {
    const { fromSourceId, fromEntityType, toSourceId, toEntityType, associationType, batchId } = job.data;
    const startTime = Date.now();

    try {
      await this.associationService.upsertAssociation({
        from_source_id: fromSourceId,
        from_entity_type: fromEntityType,
        to_source_id: toSourceId,
        to_entity_type: toEntityType,
        association_type: associationType,
        batch_id: batchId,
      });
      return { success: true, associationType, duration_ms: Date.now() - startTime };
    } catch (error: any) {
      this.logger.error(`Failed to create association: ${error.message}`);
      throw error;
    }
  }
}
