import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../../common/entities/company.entity';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
  ) {}

  async upsertCompany(sourceId: string, data: any, batchId: string): Promise<Company> {
    const existing = await this.companyRepository.findOne({ where: { source_id: sourceId } });

    const companyData = {
      source_id: sourceId,
      company_name: data.company_name,
      domain: data.domain,
      industry: data.industry,
      annual_revenue: data.annual_revenue,
      number_of_employees: data.number_of_employees,
      properties: data,
      batch_id: batchId,
    };

    if (existing) {
      await this.companyRepository.update({ source_id: sourceId }, companyData);
      return { ...existing, ...companyData };
    }
    return await this.companyRepository.save(companyData);
  }

  async updateStatus(sourceId: string, status: string, error?: string): Promise<void> {
    await this.companyRepository.update({ source_id: sourceId }, { queue_status: status, error_message: error, updated_at: new Date() });
  }
}
