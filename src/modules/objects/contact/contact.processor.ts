import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ContactService } from './contact.service';
import { QueueNames } from 'src/common/constants/queue-names';
import { ContactJobData, EmailJobData, CallJobData, MeetingJobData, TaskJobData, NoteJobData, AssociationJobData } from 'src/common/interfaces/job-data.interface';
import { QueueService } from 'src/modules/queue/queue.service';
import { MappingService } from 'src/modules/mapping/mapping.service';
import { HubspotService } from 'src/libs/hubspot/hubspot.service';

@Processor(QueueNames.CONTACT_PROCESSING, {
  concurrency: 25,
})
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
      await this.contactService.updateStatus(sourceId, 'processing', '', {
        started_at: new Date().toISOString(),
      });

      const mappedData = await this.mappingService.applyMappingsToData('contact', sourceData, mappings);
      await this.contactService.upsertContact(sourceId, mappedData, batchId);

      await this.queueChildJobs(sourceId, batchId, sourceData);

      await this.contactService.updateStatus(sourceId, 'completed', '', {
        duration_ms: Date.now() - startTime,
      });

      return {
        success: true,
        sourceId,
        batchId,
        duration_ms: Date.now() - startTime,
      };
    } catch (error: any) {
      this.logger.error(`Failed to process contact ${sourceId}: ${error.message}`);

      await this.contactService.updateStatus(sourceId, 'failed', error.message, {
        duration_ms: Date.now() - startTime,
      });

      throw error;
    }
  }

  private chunkArray<T>(items: T[], size = 100): T[][] {
    const chunks: T[][] = [];

    for (let i = 0; i < items.length; i += size) {
      chunks.push(items.slice(i, i + size));
    }

    return chunks;
  }

  private async queueChildJobs(sourceId: string, batchId: string, sourceData: any): Promise<void> {
    const timestamp = new Date().toISOString();

    const parseIds = (field: string): string[] => {
      const value = sourceData[field];

      if (!value) {
        return [];
      }

      return String(value)
        .split(';')
        .map((id) => id.trim())
        .filter(Boolean);
    };

    const emailJobs: EmailJobData[] = parseIds('Associated Email IDs').map((emailId) => ({
      batchId,
      sourceId,
      emailId,
      properties: {},
      sourceData,
      timestamp,
    }));

    for (const chunk of this.chunkArray(emailJobs, 100)) {
      await this.queueService.addEmailJobsBulk(chunk);
    }

    const callJobs: CallJobData[] = parseIds('Associated Call IDs').map((callId) => ({
      batchId,
      sourceId,
      callId,
      properties: {},
      sourceData,
      timestamp,
    }));

    for (const chunk of this.chunkArray(callJobs, 100)) {
      await this.queueService.addCallJobsBulk(chunk);
    }

    const meetingJobs: MeetingJobData[] = parseIds('Associated Meeting IDs').map((meetingId) => ({
      batchId,
      sourceId,
      meetingId,
      properties: {},
      sourceData,
      timestamp,
    }));

    for (const chunk of this.chunkArray(meetingJobs, 100)) {
      await this.queueService.addMeetingJobsBulk(chunk);
    }

    const taskJobs: TaskJobData[] = parseIds('Associated Task IDs').map((taskId) => ({
      batchId,
      sourceId,
      taskId,
      properties: {},
      sourceData,
      timestamp,
    }));

    for (const chunk of this.chunkArray(taskJobs, 100)) {
      await this.queueService.addTaskJobsBulk(chunk);
    }

    const noteJobs: NoteJobData[] = parseIds('Associated Note IDs').map((noteId) => ({
      batchId,
      sourceId,
      noteId,
      properties: {},
      sourceData,
      timestamp,
    }));

    for (const chunk of this.chunkArray(noteJobs, 100)) {
      await this.queueService.addNoteJobsBulk(chunk);
    }

    const associationJobs: AssociationJobData[] = parseIds('Associated Company IDs').map((companyId) => ({
      batchId,
      sourceId,
      fromSourceId: sourceId,
      fromEntityType: 'contact',
      toSourceId: companyId,
      toEntityType: 'company',
      associationType: 'contact_to_company',
      timestamp,
    }));

    for (const chunk of this.chunkArray(associationJobs, 100)) {
      await this.queueService.addAssociationJobsBulk(chunk);
    }
  }
}
