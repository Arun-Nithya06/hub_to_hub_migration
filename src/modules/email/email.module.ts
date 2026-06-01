import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Email } from '../../common/entities/email.entity';
import { EmailService } from './email.service';
import { EmailProcessor } from './email.processor';

@Module({
  imports: [TypeOrmModule.forFeature([Email])],
  providers: [EmailService, EmailProcessor],
  exports: [EmailService],
})
export class EmailModule {}
