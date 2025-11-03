import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';
import {
  ArticleSubmission,
  ArticleSubmissionSchema
} from './schemas/article-submission.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ArticleSubmission.name, schema: ArticleSubmissionSchema }
    ])
  ],
  controllers: [SubmissionsController],
  providers: [SubmissionsService],
  exports: [SubmissionsService]
})
export class SubmissionsModule {}
