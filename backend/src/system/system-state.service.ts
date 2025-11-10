import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { SystemState, type SystemStateDocument } from './system-state.schema';
import { UpdateSystemConfigDto } from './dto/update-system-config.dto';

const GLOBAL_ID = 'global';

@Injectable()
export class SystemStateService {
  constructor(
    @InjectModel(SystemState.name)
    private readonly stateModel: Model<SystemStateDocument>
  ) {}

  async getState(): Promise<SystemStateDocument> {
    let state = await this.stateModel.findById(GLOBAL_ID);
    if (!state) {
      state = await this.stateModel.create({ _id: GLOBAL_ID });
    }
    return state;
  }

  async recordModerationAction() {
    await this.stateModel
      .findByIdAndUpdate(
        GLOBAL_ID,
        {
          moderationLastActionAt: new Date(),
          moderationReminderSentAt: null
        },
        { upsert: true }
      )
      .lean();
  }

  async recordAnalysisAction() {
    await this.stateModel
      .findByIdAndUpdate(
        GLOBAL_ID,
        {
          analysisLastActionAt: new Date(),
          analysisReminderSentAt: null
        },
        { upsert: true }
      )
      .lean();
  }

  async markModerationReminderSent() {
    await this.stateModel
      .findByIdAndUpdate(
        GLOBAL_ID,
        { moderationReminderSentAt: new Date() },
        { upsert: true }
      )
      .lean();
  }

  async markAnalysisReminderSent() {
    await this.stateModel
      .findByIdAndUpdate(
        GLOBAL_ID,
        { analysisReminderSentAt: new Date() },
        { upsert: true }
      )
      .lean();
  }

  async getConfig() {
    const state = await this.getState();
    return this.extractConfig(state);
  }

  async updateConfig(update: UpdateSystemConfigDto) {
    const $set: Record<string, unknown> = {};
    if (update.maintenanceMode !== undefined) {
      $set.maintenanceMode = update.maintenanceMode;
    }
    if (update.submissionsOpen !== undefined) {
      $set.submissionsOpen = update.submissionsOpen;
    }
    if (update.announcement !== undefined) {
      $set.announcement = update.announcement;
    }
    if (update.supportEmail !== undefined) {
      $set.supportEmail = update.supportEmail;
    }
    if (Object.keys($set).length) {
      await this.stateModel
        .findByIdAndUpdate(
          GLOBAL_ID,
          { $set },
          { upsert: true }
        )
        .lean();
    }
    return this.getConfig();
  }

  private extractConfig(state: SystemStateDocument) {
    return {
      maintenanceMode: state.maintenanceMode ?? false,
      submissionsOpen: state.submissionsOpen ?? true,
      announcement: state.announcement ?? '',
      supportEmail: state.supportEmail ?? ''
    };
  }
}
