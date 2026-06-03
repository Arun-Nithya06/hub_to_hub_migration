import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { NoteService } from './note.service';
import { NoteJobData } from 'src/common/interfaces/job-data.interface';
import { QueueNames } from 'src/common/constants/queue-names';

@Processor(QueueNames.NOTE_PROCESSING, { concurrency: 15 })
export class NoteProcessor extends WorkerHost {
  private readonly logger = new Logger(NoteProcessor.name);

  constructor(private noteService: NoteService) {
    super();
  }

  async process(job: Job<NoteJobData>): Promise<any> {
    const { noteId, sourceId, batchId, properties, sourceData } = job.data;
    const startTime = Date.now();

    this.logger.debug(`Processing note ${noteId} for source ${sourceId}`);

    try {
      await this.noteService.updateStatus(noteId, 'processing', '', { started_at: new Date().toISOString() });

      const noteData = {
        note_id: noteId,
        contact_source_id: sourceId,
        title: this.extractTitle(sourceData),
        body: this.extractBody(sourceData),
        note_date: properties.date ? new Date(properties.date) : new Date(),
        note_type: this.determineNoteType(sourceData),
        properties: { ...properties, source_data: sourceData },
        metadata: { created_by: sourceData['Contact owner'], source_record_id: sourceId },
      };

      await this.noteService.upsertNote(noteId, noteData, batchId);
      await this.noteService.updateStatus(noteId, 'completed', '', { duration_ms: Date.now() - startTime });

      return { success: true, noteId, duration_ms: Date.now() - startTime };
    } catch (error: any) {
      this.logger.error(`Failed to process note ${noteId}: ${error.message}`);
      await this.noteService.updateStatus(noteId, 'failed', error.message, { duration_ms: Date.now() - startTime });
      throw error;
    }
  }

  private extractTitle(sourceData: any): string {
    if (sourceData['Membership Notes']) return sourceData['Membership Notes'].substring(0, 100);
    if (sourceData['Message']) return sourceData['Message'].substring(0, 100);
    return `Note from ${sourceData['First Name'] || 'HubSpot'}`;
  }

  private extractBody(sourceData: any): string {
    if (sourceData['Membership Notes']) return sourceData['Membership Notes'];
    if (sourceData['Message']) return sourceData['Message'];
    if (sourceData['Description of first engagement']) return sourceData['Description of first engagement'];
    return '';
  }

  private determineNoteType(sourceData: any): string {
    if (sourceData['Membership Notes']) return 'membership';
    if (sourceData['Message']) return 'message';
    if (sourceData['Chat Assistant:Summary']) return 'chat';
    return 'general';
  }
}
