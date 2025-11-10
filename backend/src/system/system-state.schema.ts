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

  @Prop({ type: Boolean, default: false })
  maintenanceMode?: boolean;

  @Prop({ type: Boolean, default: true })
  submissionsOpen?: boolean;

  @Prop({ type: String, trim: true, default: '' })
  announcement?: string;

  @Prop({ type: String, trim: true, default: '' })
  supportEmail?: string;
}

export const SystemStateSchema = SchemaFactory.createForClass(SystemState);
