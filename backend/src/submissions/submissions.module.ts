import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';
import {
  ArticleSubmission,
  ArticleSubmissionSchema
} from './schemas/article-submission.schema';
import { AnalysisController } from './analysis.controller';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ArticleSubmission.name, schema: ArticleSubmissionSchema }
    ]),
    AuthModule,
    NotificationsModule
  ],
  controllers: [SubmissionsController, AnalysisController],
  providers: [SubmissionsService],
  exports: [SubmissionsService]
})
export class SubmissionsModule {}
