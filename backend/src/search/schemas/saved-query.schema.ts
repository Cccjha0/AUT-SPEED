import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument, Types } from 'mongoose';

export type SavedQueryDocument = HydratedDocument<SavedQuery>;

@Schema({
  collection: 'saved_queries',
  timestamps: true
})
export class SavedQuery {
  readonly _id!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, trim: true, lowercase: true, index: true })
  owner!: string;

  @Prop({ type: Object, required: true })
  query!: Record<string, unknown>;

  readonly createdAt!: Date;
  readonly updatedAt!: Date;
}

export const SavedQuerySchema = SchemaFactory.createForClass(SavedQuery);
