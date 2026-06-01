import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Batch } from '../../common/entities/batch.entity';
import { QueueService } from '../queue/queue.service';
import { MappingService } from '../mapping/mapping.service';
import * as fs from 'fs';
import csv from 'csv-parser';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BatchService {
  private readonly logger = new Logger(BatchService.name);

  constructor(
    @InjectRepository(Batch)
    private readonly batchRepository: Repository<Batch>,
    private readonly queueService: QueueService,
    private readonly mappingService: MappingService,
  ) {}

  async uploadAndProcess(file: any): Promise<{ batchId: string; message: string }> {
    const batchId = uuidv4();

    this.logger.log(`Starting batch ${batchId} for file ${file.originalname}`);

    const records = await this.parseFile(file.path);

    const batch = this.batchRepository.create({
      file_name: file.originalname,
      total_records: records.length,
      status: 'processing',
    });

    await this.batchRepository.save(batch);

    const mappings = await this.mappingService.getAllMappings();

    let contactCount = 0;

    for (const record of records) {
      try {
        const entityType = this.detectEntityType(record);

        const sourceId = String(record['Record ID'] || record['record_id'] || record['id'] || uuidv4());

        if (entityType === 'contact') {
          await this.queueService.addContactJob({
            batchId,
            sourceId,
            entityType,
            sourceData: record,
            mappings: mappings[entityType] || {},
            timestamp: new Date().toISOString(),
          });

          contactCount++;
        }
      } catch (error) {
        this.logger.error(`Failed to queue record`, error instanceof Error ? error.stack : String(error));
      }
    }

    this.logger.log(`Batch ${batchId}: Queued ${contactCount} contacts`);

    return {
      batchId,
      message: `Processing started. Total records: ${records.length}`,
    };
  }

  private detectEntityType(record: Record<string, any>): string {
    if (record['First Name'] || record['Last Name'] || record['Email']) {
      return 'contact';
    }

    if (record['Company Name']) {
      return 'company';
    }

    if (record['Close Date']) {
      return 'deal';
    }

    return 'contact';
  }

  private async parseFile(filePath: string): Promise<any[]> {
    const extension = filePath.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'csv':
        return this.parseCSV(filePath);

      case 'xlsx':
      case 'xls':
        return this.parseExcel(filePath);

      default:
        throw new Error(`Unsupported file type: ${extension}`);
    }
  }

  private parseCSV(filePath: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
          results.push(data);
        })
        .on('end', () => {
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }

            resolve(results);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  private async parseExcel(filePath: string): Promise<any[]> {
    try {
      const workbook = XLSX.readFile(filePath);

      const sheetName = workbook.SheetNames[0];

      if (!sheetName) {
        throw new Error('No worksheet found in Excel file');
      }

      const worksheet = workbook.Sheets[sheetName];

      if (!worksheet) {
        throw new Error(`Worksheet ${sheetName} not found`);
      }

      const results: any[] = XLSX.utils.sheet_to_json(worksheet);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      return results;
    } catch (error) {
      this.logger.error('Failed to parse Excel file', error instanceof Error ? error.stack : String(error));

      throw error;
    }
  }

  async getBatchStatus(batchId: string): Promise<any> {
    const batch = await this.batchRepository.findOne({
      where: {
        batch_id: batchId,
      },
    });

    const queueMetrics = await this.queueService.getAllQueueMetrics();

    return {
      batch,
      queue_metrics: queueMetrics,
      timestamp: new Date().toISOString(),
    };
  }

  async getAllBatches(): Promise<Batch[]> {
    return this.batchRepository.find({
      order: {
        created_at: 'DESC',
      },
    });
  }
}
