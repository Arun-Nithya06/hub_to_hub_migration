import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Meeting } from 'src/common/entities';

@Injectable()
export class MeetingService {
  constructor(
    @InjectRepository(Meeting)
    private meetingRepository: Repository<Meeting>,
  ) {}

  async upsertMeeting(meetingId: string, contactId: string, batchId: string, properties: any): Promise<Meeting> {
    const existing = await this.meetingRepository.findOne({ where: { meeting_id: meetingId } });

    const meetingData = {
      meeting_id: meetingId,
      contact_source_id: contactId,
      meeting_date: properties.date ? new Date(properties.date) : new Date(),
      title: properties.title,
      campaign: properties.campaign,
      properties,
      batch_id: batchId,
      queue_status: 'completed',
    };

    if (existing) {
      await this.meetingRepository.update({ meeting_id: meetingId }, meetingData);
      return { ...existing, ...meetingData };
    }
    return await this.meetingRepository.save(meetingData);
  }
}
