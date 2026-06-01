import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('meetings')
@Index(['meeting_id'], { unique: true })
export class Meeting extends BaseEntity {
  @Column({ length: 100, unique: true })
  meeting_id: string;

  @Column({ length: 100, nullable: true })
  contact_source_id: string;

  @Column({ type: 'timestamp', nullable: true })
  meeting_date: Date;

  @Column({ length: 500, nullable: true })
  title: string;

  @Column({ length: 255, nullable: true })
  campaign: string;

  @Column({ type: 'jsonb', default: {} })
  properties: any;

  @Column({ length: 100, nullable: true })
  batch_id: string;

  @Column({ length: 50, default: 'pending' })
  queue_status: string;
}
