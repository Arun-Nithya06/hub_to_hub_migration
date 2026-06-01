import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Deal } from '../../common/entities/deal.entity';

@Injectable()
export class DealService {
  constructor(
    @InjectRepository(Deal)
    private dealRepository: Repository<Deal>,
  ) {}

  async upsertDeal(sourceId: string, data: any, batchId: string): Promise<Deal> {
    const existing = await this.dealRepository.findOne({ where: { source_id: sourceId } });

    const dealData = {
      source_id: sourceId,
      close_date: data.close_date,
      amount: data.amount,
      stage: data.stage,
      properties: data,
      batch_id: batchId,
    };

    if (existing) {
      await this.dealRepository.update({ source_id: sourceId }, dealData);
      return { ...existing, ...dealData };
    }
    return await this.dealRepository.save(dealData);
  }

  async updateStatus(sourceId: string, status: string, error?: string): Promise<void> {
    await this.dealRepository.update({ source_id: sourceId }, { queue_status: status, error_message: error, updated_at: new Date() });
  }
}
