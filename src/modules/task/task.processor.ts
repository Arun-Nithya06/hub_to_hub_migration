import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { TaskService } from './task.service';
import { QueueNames } from 'src/common/constants/queue-names';
import { TaskJobData } from 'src/common/interfaces/job-data.interface';

@Processor(QueueNames.TASK_PROCESSING, { concurrency: 15 })
export class TaskProcessor extends WorkerHost {
  private readonly logger = new Logger(TaskProcessor.name);

  constructor(private taskService: TaskService) {
    super();
  }

  async process(job: Job<TaskJobData>): Promise<any> {
    const { taskId, sourceId, batchId, properties } = job.data;
    const startTime = Date.now();

    try {
      await this.taskService.upsertTask(taskId, sourceId, batchId, properties);
      return { success: true, taskId, duration_ms: Date.now() - startTime };
    } catch (error: any) {
      this.logger.error(`Failed to process task ${taskId}: ${error?.message}`);
      throw error;
    }
  }
}
