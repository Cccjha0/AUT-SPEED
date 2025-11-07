import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Practice, PracticeSchema } from '../practices/schemas/practice.schema';
import { Claim, ClaimSchema } from '../claims/schemas/claim.schema';
import {
  ArticleSubmission,
  ArticleSubmissionSchema
} from '../submissions/schemas/article-submission.schema';
import {
  ArticleEvidence,
  ArticleEvidenceSchema
} from '../evidence/schemas/article-evidence.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Practice.name, schema: PracticeSchema },
      { name: Claim.name, schema: ClaimSchema },
      { name: ArticleSubmission.name, schema: ArticleSubmissionSchema },
      { name: ArticleEvidence.name, schema: ArticleEvidenceSchema }
    ])
  ],
  controllers: [AdminController],
  providers: [AdminService]
})
export class AdminModule {}
