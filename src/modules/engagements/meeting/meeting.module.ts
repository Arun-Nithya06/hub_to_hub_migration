import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Meeting } from '../../../common/entities';
import { MeetingService } from './meeting.service';
import { MeetingProcessor } from './meeting.processor';

@Module({
  imports: [TypeOrmModule.forFeature([Meeting])],
  providers: [MeetingService, MeetingProcessor],
  exports: [MeetingService],
})
export class MeetingModule {}
