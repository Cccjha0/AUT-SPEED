import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument, Types } from 'mongoose';

export type StaffMemberDocument = HydratedDocument<StaffMember>;

@Schema({
  collection: 'staff_members',
  timestamps: true
})
export class StaffMember {
  readonly _id!: Types.ObjectId;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ trim: true })
  name?: string;

  @Prop({ type: [String], required: true, default: [], index: true })
  roles!: string[];

  @Prop({ type: Boolean, default: true })
  active!: boolean;

  @Prop({ type: Date, default: null })
  lastNotifiedAt?: Date | null;

  readonly createdAt!: Date;
  readonly updatedAt!: Date;
}

export const StaffMemberSchema = SchemaFactory.createForClass(StaffMember);
StaffMemberSchema.index({ roles: 1, active: 1 });
