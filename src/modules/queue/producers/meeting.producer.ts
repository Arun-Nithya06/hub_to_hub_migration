import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueNames } from 'src/common/constants/queue-names';
import { MeetingJobData } from 'src/common/interfaces/job-data.interface';

@Injectable()
export class MeetingProducer {
  constructor(@InjectQueue(QueueNames.MEETING_PROCESSING) private meetingQueue: Queue) {}

  async addJob(data: MeetingJobData): Promise<string> {
    const job = await this.meetingQueue.add('process-meeting', data, {
      jobId: `meeting-${data.meetingId}-${data.batchId}`,
      priority: 2,
    });
    return job.id as string;
  }
}
