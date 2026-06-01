import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('companies')
@Index(['source_id'], { unique: true })
export class Company extends BaseEntity {
  @Column({ length: 100, unique: true })
  source_id: string;

  @Column({ length: 500, nullable: true })
  company_name: string;

  @Column({ length: 255, nullable: true })
  domain: string;

  @Column({ length: 255, nullable: true })
  industry: string;

  @Column({ type: 'decimal', nullable: true })
  annual_revenue: number;

  @Column({ nullable: true })
  number_of_employees: number;

  @Column({ type: 'jsonb', default: {} })
  properties: any;

  @Column({ length: 100, nullable: true })
  batch_id: string;

  @Column({ length: 50, default: 'pending' })
  queue_status: string;

  @Column({ type: 'text', nullable: true })
  error_message: string;
}
