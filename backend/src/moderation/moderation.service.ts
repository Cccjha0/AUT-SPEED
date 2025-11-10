import { Injectable } from '@nestjs/common';
import type { ListSubmissionsQueryDto } from '../submissions/dto/list-submissions.dto';
import type { RejectSubmissionDto } from '../submissions/dto/reject-submission.dto';
import { SubmissionStatus } from '../submissions/schemas/article-submission.schema';
import { SubmissionsService } from '../submissions/submissions.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ModerationService {
  constructor(
    private readonly submissionsService: SubmissionsService,
    private readonly notifications: NotificationsService
  ) {}

  async listQueued(query: Omit<ListSubmissionsQueryDto, 'status'>) {
    return this.submissionsService.findAll({
      ...query,
      status: SubmissionStatus.Queued
    });
  }

  async accept(id: string) {
    const result = await this.submissionsService.accept(id);
    await this.notifyModeratorsIfNeeded();
    return result;
  }

  async reject(id: string, payload: RejectSubmissionDto) {
    const result = await this.submissionsService.reject(id, payload);
    await this.notifyModeratorsIfNeeded();
    return result;
  }

  private async notifyModeratorsIfNeeded() {
    const queue = await this.submissionsService.findAll({
      limit: 1,
      skip: 0,
      status: SubmissionStatus.Queued
    });
    if (queue.total > 0) {
      await this.notifications.notifyModerators(queue.total);
    }
  }
}
