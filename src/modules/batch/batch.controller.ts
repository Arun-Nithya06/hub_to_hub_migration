import { Controller, Post, Get, Param, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BatchService } from './batch.service';
import { QueueService } from '../queue/queue.service';
import { Multer } from 'multer';

@Controller('batches')
export class BatchController {
  constructor(
    private readonly batchService: BatchService,
    private readonly queueService: QueueService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.batchService.uploadAndProcess(file);
  }

  @Get(':batchId/status')
  async getBatchStatus(@Param('batchId') batchId: string) {
    return this.batchService.getBatchStatus(batchId);
  }

  @Get('queues/metrics')
  async getAllQueueMetrics() {
    return this.queueService.getAllQueueMetrics();
  }

  @Get()
  async getAllBatches() {
    return this.batchService.getAllBatches();
  }
}
