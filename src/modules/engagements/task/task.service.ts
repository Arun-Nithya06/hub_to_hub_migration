import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from 'src/common/entities';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  async upsertTask(taskId: string, contactId: string, batchId: string, properties: any): Promise<Task> {
    const existing = await this.taskRepository.findOne({ where: { task_id: taskId } });

    const taskData = {
      task_id: taskId,
      contact_source_id: contactId,
      title: properties.title,
      description: properties.description,
      due_date: properties.due_date ? new Date(properties.due_date) : null,
      status: properties.status,
      properties,
      batch_id: batchId,
      queue_status: 'completed',
    };

    if (existing) {
      await this.taskRepository.update({ task_id: taskId }, taskData);
      return { ...existing, ...taskData };
    }
    return await this.taskRepository.save(taskData);
  }
}
