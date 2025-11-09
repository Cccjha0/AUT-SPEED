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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ArticleSubmission.name, schema: ArticleSubmissionSchema }
    ]),
    AuthModule
  ],
  controllers: [SubmissionsController, AnalysisController],
  providers: [SubmissionsService],
  exports: [SubmissionsService]
})
export class SubmissionsModule {}
