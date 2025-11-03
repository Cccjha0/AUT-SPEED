import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument, Types } from 'mongoose';
import { Practice } from '../../practices/schemas/practice.schema';

export type ClaimDocument = HydratedDocument<Claim>;

@Schema({
  collection: 'claims',
  timestamps: true
})
export class Claim {
  readonly _id!: Types.ObjectId;

  @Prop({ required: true, trim: true, ref: Practice.name })
  practiceKey!: string;

  @Prop({ required: true, unique: true, trim: true })
  key!: string;

  @Prop({ required: true, trim: true })
  text!: string;

  readonly createdAt!: Date;

  readonly updatedAt!: Date;
}

export const ClaimSchema = SchemaFactory.createForClass(Claim);

ClaimSchema.index({ key: 1 }, { unique: true });
ClaimSchema.index({ practiceKey: 1 });
