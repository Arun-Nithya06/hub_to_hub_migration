import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('emails')
@Index(['email_id'], { unique: true })
export class Email extends BaseEntity {
  @Column({ length: 100, unique: true })
  email_id: string;

  @Column({ length: 100, nullable: true })
  contact_source_id: string;

  @Column({ length: 500, nullable: true })
  subject: string;

  @Column({ type: 'text', nullable: true })
  body: string;

  @Column({ type: 'timestamp', nullable: true })
  sent_date: Date;

  @Column({ length: 50, nullable: true })
  email_type: string;

  @Column({ type: 'jsonb', default: {} })
  properties: any;

  @Column({ length: 100, nullable: true })
  batch_id: string;

  @Column({ length: 50, default: 'pending' })
  queue_status: string;
}
