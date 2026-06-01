import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('associations')
@Index(['from_source_id', 'from_entity_type', 'to_source_id', 'to_entity_type', 'association_type'], { unique: true })
export class Association extends BaseEntity {
  @Column({ length: 100, unique: true })
  association_id: string;

  @Column({ length: 100 })
  from_source_id: string;

  @Column({ length: 50 })
  from_entity_type: string;

  @Column({ length: 100 })
  to_source_id: string;

  @Column({ length: 50 })
  to_entity_type: string;

  @Column({ length: 100 })
  association_type: string;

  @Column({ length: 100, nullable: true })
  batch_id: string;

  @Column({ length: 50, default: 'pending' })
  queue_status: string;
}
