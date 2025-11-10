import { Module } from '@nestjs/common';
import { ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';
import { SubmissionsModule } from '../submissions/submissions.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [SubmissionsModule, AuthModule, NotificationsModule],
  controllers: [ModerationController],
  providers: [ModerationService]
})
export class ModerationModule {}
