import { Injectable } from '@nestjs/common';
import type { ListSubmissionsQueryDto } from '../submissions/dto/list-submissions.dto';
import type { RejectSubmissionDto } from '../submissions/dto/reject-submission.dto';
import { SubmissionStatus } from '../submissions/schemas/article-submission.schema';
import { SubmissionsService } from '../submissions/submissions.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SystemStateService } from '../system/system-state.service';

@Injectable()
export class ModerationService {
  constructor(
    private readonly submissionsService: SubmissionsService,
    private readonly notifications: NotificationsService,
    private readonly systemState: SystemStateService
  ) {}

  async listQueued(query: Omit<ListSubmissionsQueryDto, 'status'>) {
    const result = await this.submissionsService.findAll({
      ...query,
      status: SubmissionStatus.Queued
    });
    await this.maybeSendInactivityReminder(result.total);
    return result;
  }

  async accept(id: string) {
    const result = await this.submissionsService.accept(id);
    await this.notifyModeratorsOfQueue();
    return result;
  }

  async reject(id: string, payload: RejectSubmissionDto) {
    const result = await this.submissionsService.reject(id, payload);
    await this.notifyModeratorsOfQueue();
    return result;
  }

  private async notifyModeratorsOfQueue() {
    const queue = await this.submissionsService.findAll({
      limit: 1,
      skip: 0,
      status: SubmissionStatus.Queued
    });
    if (queue.total > 0) {
      await this.notifications.notifyModerators(queue.total);
    }
  }

  private async maybeSendInactivityReminder(total: number) {
    if (!total) {
      return;
    }
    const state = await this.systemState.getState();
    const lastAction = state.moderationLastActionAt
      ? new Date(state.moderationLastActionAt)
      : null;
    const lastReminder = state.moderationReminderSentAt
      ? new Date(state.moderationReminderSentAt)
      : null;
    const threshold = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const inactive =
      !lastAction || now - lastAction.getTime() >= threshold;
    const alreadyReminded =
      lastReminder && (!lastAction || lastReminder > lastAction);
    if (inactive && !alreadyReminded) {
      await this.notifications.notifyModerationInactivity(total);
      await this.systemState.markModerationReminderSent();
    }
  }
}
