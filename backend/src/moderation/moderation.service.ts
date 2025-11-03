import { Injectable } from '@nestjs/common';
import type { ListSubmissionsQueryDto } from '../submissions/dto/list-submissions.dto';
import type { RejectSubmissionDto } from '../submissions/dto/reject-submission.dto';
import { SubmissionStatus } from '../submissions/schemas/article-submission.schema';
import { SubmissionsService } from '../submissions/submissions.service';

@Injectable()
export class ModerationService {
  constructor(private readonly submissionsService: SubmissionsService) {}

  async listQueued(query: Omit<ListSubmissionsQueryDto, 'status'>) {
    return this.submissionsService.findAll({
      ...query,
      status: SubmissionStatus.Queued
    });
  }

  async accept(id: string) {
    return this.submissionsService.accept(id);
  }

  async reject(id: string, payload: RejectSubmissionDto) {
    return this.submissionsService.reject(id, payload);
  }
}
