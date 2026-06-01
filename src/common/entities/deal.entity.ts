import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('deals')
@Index(['source_id'], { unique: true })
export class Deal extends BaseEntity {
  @Column({ length: 100, unique: true })
  source_id: string;

  @Column({ type: 'date', nullable: true })
  close_date: Date;

  @Column({ type: 'decimal', nullable: true })
  amount: number;

  @Column({ length: 100, nullable: true })
  stage: string;

  @Column({ type: 'jsonb', default: {} })
  properties: any;

  @Column({ length: 100, nullable: true })
  batch_id: string;

  @Column({ length: 50, default: 'pending' })
  queue_status: string;

  @Column({ type: 'text', nullable: true })
  error_message: string;
}
