import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('calls')
@Index(['call_id'], { unique: true })
export class Call extends BaseEntity {
  @Column({ length: 100, unique: true })
  call_id: string;

  @Column({ length: 100, nullable: true })
  contact_source_id: string;

  @Column({ type: 'timestamp', nullable: true })
  call_date: Date;

  @Column({ nullable: true })
  duration: number;

  @Column({ length: 50, nullable: true })
  direction: string;

  @Column({ type: 'jsonb', default: {} })
  properties: any;

  @Column({ length: 100, nullable: true })
  batch_id: string;

  @Column({ length: 50, default: 'pending' })
  queue_status: string;
}
