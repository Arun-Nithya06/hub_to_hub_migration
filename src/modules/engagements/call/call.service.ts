import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Call } from 'src/common/entities';

@Injectable()
export class CallService {
  constructor(
    @InjectRepository(Call)
    private callRepository: Repository<Call>,
  ) {}

  async upsertCall(callId: string, contactId: string, batchId: string, properties: any): Promise<Call> {
    const existing = await this.callRepository.findOne({ where: { call_id: callId } });

    const callData = {
      call_id: callId,
      contact_source_id: contactId,
      call_date: properties.date ? new Date(properties.date) : new Date(),
      duration: properties.duration,
      direction: properties.direction,
      properties,
      batch_id: batchId,
      queue_status: 'completed',
    };

    if (existing) {
      await this.callRepository.update({ call_id: callId }, callData);
      return { ...existing, ...callData };
    }
    return await this.callRepository.save(callData);
  }
}
