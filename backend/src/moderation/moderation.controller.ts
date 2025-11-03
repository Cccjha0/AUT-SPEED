import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import type { ListSubmissionsQueryDto } from '../submissions/dto/list-submissions.dto';
import type { RejectSubmissionDto } from '../submissions/dto/reject-submission.dto';
import { ModerationService } from './moderation.service';

@Controller('moderation')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Get('queue')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async queue(@Query() query: Omit<ListSubmissionsQueryDto, 'status'>) {
    try {
      const safeQuery = {
        limit: query.limit ?? 10,
        skip: query.skip ?? 0
      };

      const data = await this.moderationService.listQueued(safeQuery);
      return this.wrapSuccess(data);
    } catch (error) {
      this.wrapAndThrowError(error);
    }
  }

  @Post(':id/accept')
  async accept(@Param('id') id: string) {
    try {
      const data = await this.moderationService.accept(id);
      return this.wrapSuccess(data);
    } catch (error) {
      this.wrapAndThrowError(error);
    }
  }

  @Post(':id/reject')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async reject(@Param('id') id: string, @Body() payload: RejectSubmissionDto) {
    try {
      const data = await this.moderationService.reject(id, payload);
      return this.wrapSuccess(data);
    } catch (error) {
      this.wrapAndThrowError(error);
    }
  }

  private wrapSuccess<T>(data: T) {
    return { data, error: null };
  }

  private wrapAndThrowError(error: unknown): never {
    if (error instanceof HttpException) {
      const status = error.getStatus();
      const response = error.getResponse();
      const message =
        typeof response === 'string'
          ? response
          : (response as Record<string, unknown>).message ?? 'Request failed';
      throw new HttpException({ data: null, error: { message } }, status);
    }

    throw new HttpException(
      { data: null, error: { message: 'Request failed' } },
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}
