import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EvidenceController } from './evidence.controller';
import { EvidenceService } from './evidence.service';
import { ArticleEvidence, ArticleEvidenceSchema } from './schemas/article-evidence.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ArticleEvidence.name, schema: ArticleEvidenceSchema }
    ])
  ],
  controllers: [EvidenceController],
  providers: [EvidenceService],
  exports: [EvidenceService]
})
export class EvidenceModule {}
