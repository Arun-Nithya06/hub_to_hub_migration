import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { EmailService } from './email.service';
import { QueueNames } from 'src/common/constants/queue-names';
import { EmailJobData } from 'src/common/interfaces/job-data.interface';

@Processor(QueueNames.EMAIL_PROCESSING, { concurrency: 15 })
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private emailService: EmailService) {
    super();
  }

  async process(job: Job<EmailJobData>): Promise<any> {
    const { emailId, sourceId, batchId, properties } = job.data;
    const startTime = Date.now();

    try {
      await this.emailService.upsertEmail(emailId, sourceId, batchId, properties);
      return { success: true, emailId, duration_ms: Date.now() - startTime };
    } catch (error: any) {
      this.logger.error(`Failed to process email ${emailId}: ${error.message}`);
      throw error;
    }
  }
}
