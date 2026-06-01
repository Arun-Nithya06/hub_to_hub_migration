import { Controller, Get, Param, Query } from '@nestjs/common';
import { ContactService } from './contact.service';

@Controller('contacts')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Get()
  async getAll(@Query('batchId') batchId?: string, @Query('status') status?: string, @Query('limit') limit = 100, @Query('offset') offset = 0) {
    return await this.contactService.findAll(batchId, status, limit, offset);
  }

  @Get(':sourceId')
  async getOne(@Param('sourceId') sourceId: string) {
    return await this.contactService.findOne(sourceId);
  }

  @Get(':sourceId/status')
  async getStatus(@Param('sourceId') sourceId: string) {
    const contact = await this.contactService.findOne(sourceId);
    if (!contact) return { error: 'Contact not found' };
    return {
      source_id: contact.source_id,
      queue_status: contact.queue_status,
      error_message: contact.error_message,
      processing_metadata: contact.processing_metadata,
    };
  }
}
