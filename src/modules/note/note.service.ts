import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Note } from '../../common/entities/note.entity';

@Injectable()
export class NoteService {
  private readonly logger = new Logger(NoteService.name);

  constructor(
    @InjectRepository(Note)
    private noteRepository: Repository<Note>,
  ) {}

  async upsertNote(noteId: string, data: any, batchId: string): Promise<Note> {
    const existing = await this.noteRepository.findOne({ where: { note_id: noteId } });

    const noteData = {
      note_id: noteId,
      contact_source_id: data.contact_source_id,
      company_source_id: data.company_source_id,
      deal_source_id: data.deal_source_id,
      title: data.title,
      body: data.body,
      note_date: data.note_date,
      note_type: data.note_type,
      properties: data.properties || {},
      metadata: data.metadata || {},
      batch_id: batchId,
    };

    if (existing) {
      await this.noteRepository.update({ note_id: noteId }, noteData);
      return { ...existing, ...noteData };
    }
    return await this.noteRepository.save(noteData);
  }

  async updateStatus(noteId: string, status: string, error?: string, metadata?: any): Promise<void> {
    await this.noteRepository.update({ note_id: noteId }, { queue_status: status, error_message: error, processing_metadata: metadata, updated_at: new Date() });
  }
}
