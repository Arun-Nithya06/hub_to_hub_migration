import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ContactService } from './contact.service';
import { QueueService } from '../queue/queue.service';
import { MappingService } from '../mapping/mapping.service';
import { QueueNames } from 'src/common/constants/queue-names';
import { ContactJobData } from 'src/common/interfaces/job-data.interface';
import { HubspotService } from '../../libs/hubspot/hubspot.service';

@Processor(QueueNames.CONTACT_PROCESSING, { concurrency: 10 })
export class ContactProcessor extends WorkerHost {
  private readonly logger = new Logger(ContactProcessor.name);

  constructor(
    private readonly contactService: ContactService,
    private readonly queueService: QueueService,
    private readonly mappingService: MappingService,
    private readonly hubspotService: HubspotService,
  ) {
    super();
  }

  async process(job: Job<ContactJobData>): Promise<any> {
    const { sourceId, batchId, sourceData, mappings } = job.data;
    const startTime = Date.now();

    this.logger.log(`Processing contact ${sourceId}`);

    try {
      await this.contactService.updateStatus(sourceId, 'processing', '', { started_at: new Date().toISOString() });

      const mappedData = await this.mappingService.applyMappingsToData('contact', sourceData, mappings);
      await this.contactService.upsertContact(sourceId, mappedData, batchId);

      await this.queueChildJobs(sourceId, batchId, sourceData);

      await this.contactService.updateStatus(sourceId, 'completed', '', { duration_ms: Date.now() - startTime });

      return { success: true, sourceId, batchId, duration_ms: Date.now() - startTime };
    } catch (error: any) {
      this.logger.error(`Failed to process contact ${sourceId}: ${error.message}`);
      await this.contactService.updateStatus(sourceId, 'failed', error.message, { duration_ms: Date.now() - startTime });
      throw error;
    }
  }

  private async queueChildJobs(sourceId: string, batchId: string, sourceData: any): Promise<void> {
    const parseIds = (field: string): string[] => {
      const value = sourceData[field];
      return value && value.trim()
        ? value
            .split(';')
            .map((id) => id.trim())
            .filter((id) => id)
        : [];
    };

    // Queue emails
    for (const emailId of parseIds('Associated Email IDs')) {
      await this.queueService.addEmailJob({
        batchId,
        sourceId,
        emailId,
        properties: {},
        sourceData,
        timestamp: new Date().toISOString(),
      });
    }

    // Queue calls
    for (const callId of parseIds('Associated Call IDs')) {
      await this.queueService.addCallJob({
        batchId,
        sourceId,
        callId,
        properties: {},
        sourceData,
        timestamp: new Date().toISOString(),
      });
    }

    // Queue meetings
    for (const meetingId of parseIds('Associated Meeting IDs')) {
      await this.queueService.addMeetingJob({
        batchId,
        sourceId,
        meetingId,
        properties: {},
        sourceData,
        timestamp: new Date().toISOString(),
      });
    }

    // Queue tasks
    for (const taskId of parseIds('Associated Task IDs')) {
      await this.queueService.addTaskJob({
        batchId,
        sourceId,
        taskId,
        properties: {},
        sourceData,
        timestamp: new Date().toISOString(),
      });
    }

    // Queue notes
    for (const noteId of parseIds('Associated Note IDs')) {
      await this.queueService.addNoteJob({
        batchId,
        sourceId,
        noteId,
        properties: {},
        sourceData,
        timestamp: new Date().toISOString(),
      });
    }

    // Queue associations
    for (const companyId of parseIds('Associated Company IDs')) {
      await this.queueService.addAssociationJob({
        batchId,
        sourceId,
        fromSourceId: sourceId,
        fromEntityType: 'contact',
        toSourceId: companyId,
        toEntityType: 'company',
        associationType: 'contact_to_company',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
