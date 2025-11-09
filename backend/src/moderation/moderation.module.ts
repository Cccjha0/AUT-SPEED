import { Module } from '@nestjs/common';
import { ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';
import { SubmissionsModule } from '../submissions/submissions.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [SubmissionsModule, AuthModule],
  controllers: [ModerationController],
  providers: [ModerationService]
})
export class ModerationModule {}
