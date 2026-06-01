import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueNames } from 'src/common/constants/queue-names';
import { NoteJobData } from 'src/common/interfaces/job-data.interface';

@Injectable()
export class NoteProducer {
  constructor(@InjectQueue(QueueNames.NOTE_PROCESSING) private noteQueue: Queue) {}

  async addJob(data: NoteJobData): Promise<string> {
    const job = await this.noteQueue.add('process-note', data, {
      jobId: `note-${data.noteId}-${data.batchId}`,
      priority: 2,
    });
    return job.id as string;
  }
}
