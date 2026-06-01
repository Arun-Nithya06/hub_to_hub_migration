import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Note } from '../../common/entities/note.entity';
import { NoteService } from './note.service';
import { NoteProcessor } from './note.processor';

@Module({
  imports: [TypeOrmModule.forFeature([Note])],
  providers: [NoteService, NoteProcessor],
  exports: [NoteService],
})
export class NoteModule {}
