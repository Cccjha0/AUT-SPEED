
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Claim, ClaimSchema } from '../claims/schemas/claim.schema';
import { ArticleEvidence, ArticleEvidenceSchema } from '../evidence/schemas/article-evidence.schema';
import { Practice, PracticeSchema } from '../practices/schemas/practice.schema';
import {
  ArticleSubmission,
  ArticleSubmissionSchema
} from '../submissions/schemas/article-submission.schema';
import { UserRating, UserRatingSchema } from '../ratings/schemas/user-rating.schema';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { SavedQuery, SavedQuerySchema } from './schemas/saved-query.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Practice.name, schema: PracticeSchema },
      { name: Claim.name, schema: ClaimSchema },
      { name: ArticleEvidence.name, schema: ArticleEvidenceSchema },
      { name: ArticleSubmission.name, schema: ArticleSubmissionSchema },
      { name: UserRating.name, schema: UserRatingSchema },
      { name: SavedQuery.name, schema: SavedQuerySchema }
    ])
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService]
})
export class SearchModule {}
