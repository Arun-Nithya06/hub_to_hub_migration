import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from 'src/common/entities';
import { TaskService } from './task.service';
import { TaskProcessor } from './task.processor';

@Module({
  imports: [TypeOrmModule.forFeature([Task])],
  providers: [TaskService, TaskProcessor],
  exports: [TaskService],
})
export class TaskModule {}
