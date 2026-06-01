import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('notes')
@Index(['note_id'], { unique: true })
export class Note extends BaseEntity {
  @Column({ length: 100, unique: true })
  note_id: string;

  @Column({ length: 100, nullable: true })
  contact_source_id: string;

  @Column({ length: 100, nullable: true })
  company_source_id: string;

  @Column({ length: 100, nullable: true })
  deal_source_id: string;

  @Column({ type: 'text', nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  body: string;

  @Column({ type: 'timestamp', nullable: true })
  note_date: Date;

  @Column({ length: 50, nullable: true })
  note_type: string;

  @Column({ type: 'jsonb', default: {} })
  properties: any;

  @Column({ type: 'jsonb', default: {} })
  metadata: any;

  @Column({ length: 100, nullable: true })
  batch_id: string;

  @Column({ length: 50, default: 'pending' })
  queue_status: string;

  @Column({ type: 'text', nullable: true })
  error_message: string;

  @Column({ type: 'jsonb', default: {} })
  processing_metadata: any;
}
