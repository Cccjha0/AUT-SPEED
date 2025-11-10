import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export type SystemStateDocument = HydratedDocument<SystemState>;

@Schema({ collection: 'system_state', timestamps: true })
export class SystemState {
  @Prop({ type: String, default: 'global' })
  readonly _id!: string;

  @Prop({ type: Date, default: null })
  moderationLastActionAt?: Date | null;

  @Prop({ type: Date, default: null })
  moderationReminderSentAt?: Date | null;

  @Prop({ type: Date, default: null })
  analysisLastActionAt?: Date | null;

  @Prop({ type: Date, default: null })
  analysisReminderSentAt?: Date | null;
}

export const SystemStateSchema = SchemaFactory.createForClass(SystemState);
