import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument, Types } from 'mongoose';

export type ArticleEvidenceDocument = HydratedDocument<ArticleEvidence>;

export enum EvidenceResult {
  Agree = 'agree',
  Disagree = 'disagree',
  Mixed = 'mixed'
}

export enum EvidenceMethodType {
  Experiment = 'experiment',
  CaseStudy = 'case-study',
  Survey = 'survey',
  MetaAnalysis = 'meta-analysis',
  Other = 'other'
}

export enum EvidenceParticipantType {
  Student = 'student',
  Practitioner = 'practitioner',
  Mixed = 'mixed',
  Unknown = 'unknown'
}

@Schema({
  collection: 'article_evidence',
  timestamps: true
})
export class ArticleEvidence {
  readonly _id!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  articleDoi!: string;

  @Prop({ required: true, trim: true })
  practiceKey!: string;

  @Prop({ required: true, trim: true })
  claimKey!: string;

  @Prop({ required: true, enum: EvidenceResult })
  result!: EvidenceResult;

  @Prop({ required: true, enum: EvidenceMethodType, default: EvidenceMethodType.Other })
  methodType!: EvidenceMethodType;

  @Prop({ enum: EvidenceParticipantType })
  participantType?: EvidenceParticipantType;

  @Prop({ trim: true })
  notes?: string;

  @Prop({ trim: true })
  analyst?: string;

  readonly createdAt!: Date;

  readonly updatedAt!: Date;
}

export const ArticleEvidenceSchema = SchemaFactory.createForClass(ArticleEvidence);

ArticleEvidenceSchema.index({ articleDoi: 1 });
ArticleEvidenceSchema.index({ practiceKey: 1 });
ArticleEvidenceSchema.index({ claimKey: 1 });
ArticleEvidenceSchema.index({ articleDoi: 1, claimKey: 1 }, { unique: true });
