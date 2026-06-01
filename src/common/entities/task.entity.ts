import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('tasks')
@Index(['task_id'], { unique: true })
export class Task extends BaseEntity {
  @Column({ length: 100, unique: true })
  task_id: string;

  @Column({ length: 100, nullable: true })
  contact_source_id: string;

  @Column({ length: 500, nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'timestamp', nullable: true })
  due_date: Date | null;

  @Column({ length: 50, nullable: true })
  status: string;

  @Column({ type: 'jsonb', default: {} })
  properties: any;

  @Column({ length: 100, nullable: true })
  batch_id: string;

  @Column({ length: 50, default: 'pending' })
  queue_status: string;
}
