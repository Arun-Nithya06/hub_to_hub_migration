import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('contacts')
@Index(['source_id'], { unique: true })
@Index(['batch_id'])
@Index(['queue_status'])
export class Contact extends BaseEntity {
  @Column({ length: 100, unique: true })
  source_id: string;

  @Column({ length: 100, unique: true })
  destination_id: string;

  @Column({ length: 255, nullable: true })
  email: string;

  @Column({ length: 255, nullable: true })
  first_name: string;

  @Column({ length: 255, nullable: true })
  last_name: string;

  @Column({ length: 100, nullable: true })
  lifecycle_stage: string;

  @Column({ length: 255, nullable: true })
  owner: string;

  @Column({ type: 'jsonb', default: {} })
  properties: any;

  @Column({ length: 100, nullable: true })
  batch_id: string;

  @Column({ length: 50, default: 'pending' })
  queue_status: string;

  @Column({ type: 'text', nullable: true })
  error_message: string;

  @Column({ type: 'jsonb', default: {} })
  processing_metadata: any;
}
