import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Email } from 'src/common/entities';

@Injectable()
export class EmailService {
  constructor(
    @InjectRepository(Email)
    private emailRepository: Repository<Email>,
  ) {}

  async upsertEmail(emailId: string, contactId: string, batchId: string, properties: any): Promise<Email> {
    const existing = await this.emailRepository.findOne({ where: { email_id: emailId } });

    const emailData = {
      email_id: emailId,
      contact_source_id: contactId,
      subject: properties.subject || 'No subject',
      body: properties.body,
      sent_date: properties.date ? new Date(properties.date) : new Date(),
      email_type: properties.type,
      properties,
      batch_id: batchId,
      queue_status: 'completed',
    };

    if (existing) {
      await this.emailRepository.update({ email_id: emailId }, emailData);
      return { ...existing, ...emailData };
    }
    return await this.emailRepository.save(emailData);
  }
}
