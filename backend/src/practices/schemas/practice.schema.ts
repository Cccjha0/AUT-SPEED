import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument, Types } from 'mongoose';

export type PracticeDocument = HydratedDocument<Practice>;

@Schema({
  collection: 'practices',
  timestamps: true
})
export class Practice {
  readonly _id!: Types.ObjectId;

  @Prop({ required: true, unique: true, trim: true })
  key!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  readonly createdAt!: Date;

  readonly updatedAt!: Date;
}

export const PracticeSchema = SchemaFactory.createForClass(Practice);
