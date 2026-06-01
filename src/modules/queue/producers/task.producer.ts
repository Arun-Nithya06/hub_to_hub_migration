import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueNames } from 'src/common/constants/queue-names';
import { TaskJobData } from 'src/common/interfaces/job-data.interface';

@Injectable()
export class TaskProducer {
  constructor(@InjectQueue(QueueNames.TASK_PROCESSING) private taskQueue: Queue) {}

  async addJob(data: TaskJobData): Promise<string> {
    const job = await this.taskQueue.add('process-task', data, {
      jobId: `task-${data.taskId}-${data.batchId}`,
      priority: 2,
    });
    return job.id as string;
  }
}
