import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { MailerService } from './providers/mailer.service';
import { StaffModule } from '../staff/staff.module';

@Module({
  imports: [StaffModule],
  providers: [NotificationsService, MailerService],
  exports: [NotificationsService]
})
export class NotificationsModule {}
