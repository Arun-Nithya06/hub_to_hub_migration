import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { MeetingService } from './meeting.service';
import { MeetingJobData } from 'src/common/interfaces/job-data.interface';
import { QueueNames } from 'src/common/constants/queue-names';

@Processor(QueueNames.MEETING_PROCESSING, { concurrency: 15 })
export class MeetingProcessor extends WorkerHost {
  private readonly logger = new Logger(MeetingProcessor.name);

  constructor(private meetingService: MeetingService) {
    super();
  }

  async process(job: Job<MeetingJobData>): Promise<any> {
    const { meetingId, sourceId, batchId, properties } = job.data;
    const startTime = Date.now();

    try {
      await this.meetingService.upsertMeeting(meetingId, sourceId, batchId, properties);
      return { success: true, meetingId, duration_ms: Date.now() - startTime };
    } catch (error: any) {
      this.logger.error(`Failed to process meeting ${meetingId}: ${error.message}`);
      throw error;
    }
  }
}
