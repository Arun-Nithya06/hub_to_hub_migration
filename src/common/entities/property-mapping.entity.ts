import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('property_mappings')
export class PropertyMapping extends BaseEntity {
  @Column({ length: 50 })
  entity_type: string;

  @Column({ length: 255 })
  source_field: string;

  @Column({ length: 255 })
  target_field: string;

  @Column({ length: 50, default: 'string' })
  data_type: string;

  @Column({ default: false })
  is_required: boolean;

  @Column({ type: 'text', nullable: true })
  default_value: string;

  @Column({ default: true })
  is_active: boolean;
}
