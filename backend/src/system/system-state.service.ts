import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { SystemState, type SystemStateDocument } from './system-state.schema';

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
}
