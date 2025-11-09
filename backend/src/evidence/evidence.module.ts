import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EvidenceController } from './evidence.controller';
import { EvidenceService } from './evidence.service';
import { Claim, ClaimSchema } from '../claims/schemas/claim.schema';
import { Practice, PracticeSchema } from '../practices/schemas/practice.schema';
import {
  ArticleSubmission,
  ArticleSubmissionSchema
} from '../submissions/schemas/article-submission.schema';
import { ArticleEvidence, ArticleEvidenceSchema } from './schemas/article-evidence.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ArticleEvidence.name, schema: ArticleEvidenceSchema },
      { name: ArticleSubmission.name, schema: ArticleSubmissionSchema },
      { name: Practice.name, schema: PracticeSchema },
      { name: Claim.name, schema: ClaimSchema }
    ]),
    AuthModule
  ],
  controllers: [EvidenceController],
  providers: [EvidenceService],
  exports: [EvidenceService]
})
export class EvidenceModule {}
