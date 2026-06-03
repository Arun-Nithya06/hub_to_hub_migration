import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Note } from 'src/common/entities';
import { NoteService } from './note.service';
import { NoteProcessor } from './note.processor';

@Module({
  imports: [TypeOrmModule.forFeature([Note])],
  providers: [NoteService, NoteProcessor],
  exports: [NoteService],
})
export class NoteModule {}
