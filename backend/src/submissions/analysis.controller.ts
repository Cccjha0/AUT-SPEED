import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query
} from '@nestjs/common';
import { SubmissionsService } from './submissions.service';
import { AnalysisStatus } from './schemas/article-submission.schema';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UseGuards } from '@nestjs/common';

@UseGuards(RolesGuard)
@Roles('analyst')
@Controller('analysis')
export class AnalysisController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Get('queue')
  async queue(
    @Query()
    query: Record<string, string | string[] | undefined>
  ) {
    const limit =
      typeof query.limit === 'string' ? Number(query.limit) : undefined;
    const skip =
      typeof query.skip === 'string' ? Number(query.skip) : undefined;
    const statusParam =
      typeof query.status === 'string' ? query.status : undefined;
    const status =
      statusParam && Object.values(AnalysisStatus).includes(statusParam as AnalysisStatus)
        ? (statusParam as AnalysisStatus)
        : AnalysisStatus.Todo;
    const result = await this.submissionsService.listAnalysisQueue({
      status,
      limit,
      skip
    });
    return { data: result, error: null };
  }

  @Patch(':doi/assign')
  async assign(
    @Param('doi') doi: string,
    @Body() payload: { analystId?: string }
  ) {
    if (!payload.analystId?.trim()) {
      throw new BadRequestException('analystId is required');
    }
    const submission = await this.submissionsService.assignAnalysis(
      doi,
      payload.analystId
    );
    return { data: submission, error: null };
  }

  @Patch(':doi/start')
  async start(@Param('doi') doi: string) {
    const submission = await this.submissionsService.startAnalysis(doi);
    return { data: submission, error: null };
  }

  @Patch(':doi/done')
  async done(@Param('doi') doi: string) {
    const submission = await this.submissionsService.completeAnalysis(doi);
    return { data: submission, error: null };
  }
}
