import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query
} from '@nestjs/common';
import type { RejectSubmissionDto } from '../submissions/dto/reject-submission.dto';
import { ModerationService } from './moderation.service';

@Controller('moderation')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Get('queue')
  async queue(@Query() query: Record<string, string | string[] | undefined>) {
    try {
      const limit = this.parsePositiveInt(query.limit, 10);
      const skip = this.parsePositiveInt(query.skip, 0);
      if (limit === 0) {
        throw new BadRequestException('limit must be greater than 0');
      }

      const data = await this.moderationService.listQueued({ limit, skip });
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

  private parsePositiveInt(
    raw: string | string[] | undefined,
    fallback: number
  ) {
    if (Array.isArray(raw) || raw === undefined) {
      return fallback;
    }
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) {
      return fallback;
    }
    return Math.floor(value);
  }
}

