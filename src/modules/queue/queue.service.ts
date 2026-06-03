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
    @InjectQueue(QueueNames.CONTACT_PROCESSING)
    private readonly contactQueue: Queue,

    @InjectQueue(QueueNames.COMPANY_PROCESSING)
    private readonly companyQueue: Queue,

    @InjectQueue(QueueNames.DEAL_PROCESSING)
    private readonly dealQueue: Queue,

    @InjectQueue(QueueNames.EMAIL_PROCESSING)
    private readonly emailQueue: Queue,

    @InjectQueue(QueueNames.CALL_PROCESSING)
    private readonly callQueue: Queue,

    @InjectQueue(QueueNames.MEETING_PROCESSING)
    private readonly meetingQueue: Queue,

    @InjectQueue(QueueNames.TASK_PROCESSING)
    private readonly taskQueue: Queue,

    @InjectQueue(QueueNames.NOTE_PROCESSING)
    private readonly noteQueue: Queue,

    @InjectQueue(QueueNames.ASSOCIATION_PROCESSING)
    private readonly associationQueue: Queue,
  ) {}

  private createBulkJobs<T>(name: string, jobs: T[], jobIdBuilder: (job: T) => string, priority = 1) {
    return jobs.map((job) => ({
      name,
      data: job,
      opts: {
        jobId: jobIdBuilder(job),
        priority,
      },
    }));
  }

  async addContactJob(data: ContactJobData): Promise<string> {
    const job = await this.contactQueue.add('process-contact', data, {
      jobId: `contact-${data.sourceId}-${data.batchId}`,
      priority: 1,
      attempts: 3,
    });

    return String(job.id);
  }

  async addContactJobsBulk(data: ContactJobData[]) {
    return this.contactQueue.addBulk(this.createBulkJobs('process-contact', data, (job) => `contact-${job.sourceId}-${job.batchId}`, 1));
  }

  async addCompanyJob(data: CompanyJobData): Promise<string> {
    const job = await this.companyQueue.add('process-company', data, {
      jobId: `company-${data.sourceId}-${data.batchId}`,
      priority: 1,
    });

    return String(job.id);
  }

  async addCompanyJobsBulk(data: CompanyJobData[]) {
    return this.companyQueue.addBulk(this.createBulkJobs('process-company', data, (job) => `company-${job.sourceId}-${job.batchId}`, 1));
  }

  async addDealJob(data: DealJobData): Promise<string> {
    const job = await this.dealQueue.add('process-deal', data, {
      jobId: `deal-${data.sourceId}-${data.batchId}`,
      priority: 1,
    });

    return String(job.id);
  }

  async addDealJobsBulk(data: DealJobData[]) {
    return this.dealQueue.addBulk(this.createBulkJobs('process-deal', data, (job) => `deal-${job.sourceId}-${job.batchId}`, 1));
  }

  async addEmailJob(data: EmailJobData): Promise<string> {
    const job = await this.emailQueue.add('process-email', data, {
      jobId: `email-${data.emailId}-${data.batchId}`,
      priority: 2,
    });

    return String(job.id);
  }

  async addEmailJobsBulk(data: EmailJobData[]) {
    return this.emailQueue.addBulk(this.createBulkJobs('process-email', data, (job) => `email-${job.emailId}-${job.batchId}`, 2));
  }

  async addCallJob(data: CallJobData): Promise<string> {
    const job = await this.callQueue.add('process-call', data, {
      jobId: `call-${data.callId}-${data.batchId}`,
      priority: 2,
    });

    return String(job.id);
  }

  async addCallJobsBulk(data: CallJobData[]) {
    return this.callQueue.addBulk(this.createBulkJobs('process-call', data, (job) => `call-${job.callId}-${job.batchId}`, 2));
  }

  async addMeetingJob(data: MeetingJobData): Promise<string> {
    const job = await this.meetingQueue.add('process-meeting', data, {
      jobId: `meeting-${data.meetingId}-${data.batchId}`,
      priority: 2,
    });

    return String(job.id);
  }

  async addMeetingJobsBulk(data: MeetingJobData[]) {
    return this.meetingQueue.addBulk(this.createBulkJobs('process-meeting', data, (job) => `meeting-${job.meetingId}-${job.batchId}`, 2));
  }

  async addTaskJob(data: TaskJobData): Promise<string> {
    const job = await this.taskQueue.add('process-task', data, {
      jobId: `task-${data.taskId}-${data.batchId}`,
      priority: 2,
    });

    return String(job.id);
  }

  async addTaskJobsBulk(data: TaskJobData[]) {
    return this.taskQueue.addBulk(this.createBulkJobs('process-task', data, (job) => `task-${job.taskId}-${job.batchId}`, 2));
  }

  async addNoteJob(data: NoteJobData): Promise<string> {
    const job = await this.noteQueue.add('process-note', data, {
      jobId: `note-${data.noteId}-${data.batchId}`,
      priority: 2,
    });

    return String(job.id);
  }

  async addNoteJobsBulk(data: NoteJobData[]) {
    return this.noteQueue.addBulk(this.createBulkJobs('process-note', data, (job) => `note-${job.noteId}-${job.batchId}`, 2));
  }

  async addAssociationJob(data: AssociationJobData): Promise<string> {
    const job = await this.associationQueue.add('process-association', data, {
      jobId: `assoc-${data.fromSourceId}-${data.toSourceId}-${data.batchId}`,
      priority: 3,
      delay: 1000,
    });

    return String(job.id);
  }

  async addAssociationJobsBulk(data: AssociationJobData[]) {
    return this.associationQueue.addBulk(
      data.map((job) => ({
        name: 'process-association',
        data: job,
        opts: {
          jobId: `assoc-${job.fromSourceId}-${job.toSourceId}-${job.batchId}`,
          priority: 3,
          delay: 1000,
        },
      })),
    );
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
