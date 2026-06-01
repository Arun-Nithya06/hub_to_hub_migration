import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('batches')
@Index(['batch_id'])
@Index(['status'])
export class Batch extends BaseEntity {
  @Column({ unique: true, length: 100 })
  batch_id: string;

  @Column({ length: 500, nullable: true })
  file_name: string;

  @Column({ default: 0 })
  total_records: number;

  @Column({ default: 0 })
  processed: number;

  @Column({ default: 0 })
  success: number;

  @Column({ default: 0 })
  failed: number;

  @Column({ type: 'jsonb', default: {} })
  queue_status: Record<string, any>;

  @Column({ length: 50, default: 'pending' })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  started_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date;

  @Column({ type: 'text', nullable: true })
  error_message: string;
}
