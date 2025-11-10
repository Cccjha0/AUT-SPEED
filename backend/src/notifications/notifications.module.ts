import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { MailerService } from './providers/mailer.service';

@Module({
  providers: [NotificationsService, MailerService],
  exports: [NotificationsService]
})
export class NotificationsModule {}
