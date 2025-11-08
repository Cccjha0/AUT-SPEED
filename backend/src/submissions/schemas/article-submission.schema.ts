import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument, Types } from 'mongoose';

export type ArticleSubmissionDocument = HydratedDocument<ArticleSubmission>;

export enum SubmissionStatus {
  Queued = 'queued',
  Accepted = 'accepted',
  Rejected = 'rejected'
}

@Schema({
  collection: 'article_submissions',
  timestamps: true
})
export class ArticleSubmission {
  readonly _id!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({
    type: [String],
    required: true,
    default: []
  })
  authors!: string[];

  @Prop({ required: true, trim: true })
  venue!: string;

  @Prop({ required: true, min: 1900 })
  year!: number;

  @Prop({ trim: true })
  volume?: string;

  @Prop({ trim: true })
  number?: string;

  @Prop({ trim: true })
  pages?: string;

  @Prop({ unique: true, sparse: true, trim: true, lowercase: true })
  doi?: string;

  @Prop({ required: true, trim: true })
  submittedBy!: string;

  @Prop({ required: true, trim: true, lowercase: true })
  submitterEmail!: string;

  @Prop({ type: Boolean, default: null })
  peerReviewed?: boolean | null;

  @Prop({ type: Boolean, default: null })
  seRelated?: boolean | null;

  @Prop({ type: String, trim: true })
  decisionNotes?: string;

  @Prop({ type: Date, default: null })
  lastDecisionAt?: Date | null;

  @Prop({
    required: true,
    enum: SubmissionStatus,
    default: SubmissionStatus.Queued
  })
  status!: SubmissionStatus;

  @Prop({ trim: true })
  rejectionReason?: string;

  readonly createdAt!: Date;

  readonly updatedAt!: Date;
}

export const ArticleSubmissionSchema = SchemaFactory.createForClass(ArticleSubmission);

ArticleSubmissionSchema.index({ doi: 1 }, { unique: true, sparse: true });
