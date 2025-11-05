import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument, Types } from 'mongoose';

export type UserRatingDocument = HydratedDocument<UserRating>;

@Schema({
  collection: 'user_ratings',
  timestamps: {
    createdAt: true,
    updatedAt: false
  }
})
export class UserRating {
  readonly _id!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  articleDoi!: string;

  @Prop({ required: true, min: 1, max: 5 })
  stars!: number;

  @Prop({ trim: true })
  user?: string;

  readonly createdAt!: Date;
}

export const UserRatingSchema = SchemaFactory.createForClass(UserRating);

UserRatingSchema.index({ articleDoi: 1 });
UserRatingSchema.index({ articleDoi: 1, user: 1 }, { unique: true, sparse: true });

