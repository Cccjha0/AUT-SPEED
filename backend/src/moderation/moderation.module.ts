import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';
import { ModerationAuthMiddleware } from './middleware/moderation-auth.middleware';
import { SubmissionsModule } from '../submissions/submissions.module';

@Module({
  imports: [SubmissionsModule],
  controllers: [ModerationController],
  providers: [ModerationService]
})
export class ModerationModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ModerationAuthMiddleware).forRoutes(ModerationController);
  }
}
