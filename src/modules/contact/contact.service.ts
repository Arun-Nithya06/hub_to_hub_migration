import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from '../../common/entities/contact.entity';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    @InjectRepository(Contact)
    private contactRepository: Repository<Contact>,
  ) {}

  async upsertContact(sourceId: string, data: any, batchId: string): Promise<Contact> {
    const existing = await this.contactRepository.findOne({ where: { source_id: sourceId } });

    const contactData = {
      source_id: sourceId,
      destination_id: data.destination_id,
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      lifecycle_stage: data.lifecycle_stage,
      owner: data.owner,
      properties: data,
      batch_id: batchId,
    };

    if (existing) {
      await this.contactRepository.update({ source_id: sourceId }, contactData);
      return { ...existing, ...contactData };
    }
    return await this.contactRepository.save(contactData);
  }

  async updateStatus(sourceId: string, status: string, error?: string, metadata?: any): Promise<void> {
    await this.contactRepository.update({ source_id: sourceId }, { queue_status: status, error_message: error, processing_metadata: metadata, updated_at: new Date() });
  }

  async findAll(batchId?: string, status?: string, limit = 100, offset = 0): Promise<{ data: Contact[]; total: number }> {
    const where: any = {};
    if (batchId) where.batch_id = batchId;
    if (status) where.queue_status = status;

    const [data, total] = await this.contactRepository.findAndCount({
      where,
      take: limit,
      skip: offset,
      order: { created_at: 'DESC' },
    });
    return { data, total };
  }

  async findOne(sourceId: string): Promise<Contact> {
    return (await this.contactRepository.findOne({ where: { source_id: sourceId } })) as Contact;
  }
}
