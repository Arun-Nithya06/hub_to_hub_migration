import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueNames } from '../../common/constants/queue-names';
import {
  ContactJobData,
  CompanyJobData,
  DealJobData,
  EmailJobData,
  CallJobData,
  MeetingJobData,
  TaskJobData,
  NoteJobData,
  AssociationJobData,
} from '../../common/interfaces/job-data.interface';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue(QueueNames.CONTACT_PROCESSING) private contactQueue: Queue,
    @InjectQueue(QueueNames.COMPANY_PROCESSING) private companyQueue: Queue,
    @InjectQueue(QueueNames.DEAL_PROCESSING) private dealQueue: Queue,
    @InjectQueue(QueueNames.EMAIL_PROCESSING) private emailQueue: Queue,
    @InjectQueue(QueueNames.CALL_PROCESSING) private callQueue: Queue,
    @InjectQueue(QueueNames.MEETING_PROCESSING) private meetingQueue: Queue,
    @InjectQueue(QueueNames.TASK_PROCESSING) private taskQueue: Queue,
    @InjectQueue(QueueNames.NOTE_PROCESSING) private noteQueue: Queue,
    @InjectQueue(QueueNames.ASSOCIATION_PROCESSING) private associationQueue: Queue,
  ) {}

  async addContactJob(data: ContactJobData): Promise<string> {
    const job = await this.contactQueue.add('process-contact', data, {
      jobId: `contact-${data.sourceId}-${data.batchId}`,
      priority: 1,
      attempts: 3,
    });
    return job.id as string;
  }

  async addCompanyJob(data: CompanyJobData): Promise<string> {
    const job = await this.companyQueue.add('process-company', data, {
      jobId: `company-${data.sourceId}-${data.batchId}`,
      priority: 1,
    });
    return job.id as string;
  }

  async addDealJob(data: DealJobData): Promise<string> {
    const job = await this.dealQueue.add('process-deal', data, {
      jobId: `deal-${data.sourceId}-${data.batchId}`,
      priority: 1,
    });
    return job.id as string;
  }

  async addEmailJob(data: EmailJobData): Promise<string> {
    const job = await this.emailQueue.add('process-email', data, {
      jobId: `email-${data.emailId}-${data.batchId}`,
      priority: 2,
    });
    return job.id as string;
  }

  async addCallJob(data: CallJobData): Promise<string> {
    const job = await this.callQueue.add('process-call', data, {
      jobId: `call-${data.callId}-${data.batchId}`,
      priority: 2,
    });
    return job.id as string;
  }

  async addMeetingJob(data: MeetingJobData): Promise<string> {
    const job = await this.meetingQueue.add('process-meeting', data, {
      jobId: `meeting-${data.meetingId}-${data.batchId}`,
      priority: 2,
    });
    return job.id as string;
  }

  async addTaskJob(data: TaskJobData): Promise<string> {
    const job = await this.taskQueue.add('process-task', data, {
      jobId: `task-${data.taskId}-${data.batchId}`,
      priority: 2,
    });
    return job.id as string;
  }

  async addNoteJob(data: NoteJobData): Promise<string> {
    const job = await this.noteQueue.add('process-note', data, {
      jobId: `note-${data.noteId}-${data.batchId}`,
      priority: 2,
    });
    return job.id as string;
  }

  async addAssociationJob(data: AssociationJobData): Promise<string> {
    const job = await this.associationQueue.add('process-association', data, {
      jobId: `assoc-${data.fromSourceId}-${data.toSourceId}-${data.batchId}`,
      priority: 3,
      delay: 1000,
    });
    return job.id as string;
  }

  async getAllQueueMetrics(): Promise<Record<string, any>> {
    const queues = {
      contact: this.contactQueue,
      company: this.companyQueue,
      deal: this.dealQueue,
      email: this.emailQueue,
      call: this.callQueue,
      meeting: this.meetingQueue,
      task: this.taskQueue,
      note: this.noteQueue,
      association: this.associationQueue,
    };

    const metrics: Record<string, any> = {};
    for (const [name, queue] of Object.entries(queues)) {
      metrics[name] = {
        waiting: await queue.getWaitingCount(),
        active: await queue.getActiveCount(),
        completed: await queue.getCompletedCount(),
        failed: await queue.getFailedCount(),
        delayed: await queue.getDelayedCount(),
      };
    }
    return metrics;
  }
}
