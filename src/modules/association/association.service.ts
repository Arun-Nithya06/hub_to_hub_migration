import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Association } from '../../common/entities/association.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AssociationService {
  constructor(
    @InjectRepository(Association)
    private associationRepository: Repository<Association>,
  ) {}

  async upsertAssociation(data: any): Promise<Association> {
    const existing = await this.associationRepository.findOne({
      where: {
        from_source_id: data.from_source_id,
        from_entity_type: data.from_entity_type,
        to_source_id: data.to_source_id,
        to_entity_type: data.to_entity_type,
        association_type: data.association_type,
      },
    });

    const associationData = {
      association_id: existing?.association_id || uuidv4(),
      from_source_id: data.from_source_id,
      from_entity_type: data.from_entity_type,
      to_source_id: data.to_source_id,
      to_entity_type: data.to_entity_type,
      association_type: data.association_type,
      batch_id: data.batch_id,
      queue_status: 'completed',
    };

    if (existing) {
      await this.associationRepository.update({ id: existing.id }, associationData);
      return { ...existing, ...associationData };
    }
    return await this.associationRepository.save(associationData);
  }
}
