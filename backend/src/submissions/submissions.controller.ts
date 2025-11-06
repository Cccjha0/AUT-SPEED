import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query
} from '@nestjs/common';
import { SubmissionsService } from './submissions.service';
import { SubmissionStatus } from './schemas/article-submission.schema';

@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  async create(@Body() payload: Record<string, unknown>) {
    try {
      const title =
        typeof payload.title === 'string' ? payload.title.trim() : '';
      const authors = Array.isArray(payload.authors)
        ? payload.authors.filter(
            author => typeof author === 'string' && author.trim()
          )
        : [];
      const venue =
        typeof payload.venue === 'string' ? payload.venue.trim() : '';
      const year =
        typeof payload.year === 'number'
          ? payload.year
          : Number(payload.year ?? Number.NaN);
      const doi =
        typeof payload.doi === 'string' ? payload.doi.trim() : undefined;
      const submittedBy =
        typeof payload.submittedBy === 'string'
          ? payload.submittedBy.trim()
          : undefined;

      if (!title || !authors.length || !venue || Number.isNaN(year)) {
        throw new BadRequestException(
          'Submission requires title, authors, venue, and year'
        );
      }

      const result = await this.submissionsService.create({
        title,
        authors,
        venue,
        year,
        doi,
        submittedBy
      });
      return this.wrapSuccess(result);
    } catch (error) {
      this.wrapAndThrowError(error);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const result = await this.submissionsService.findById(id);
      return this.wrapSuccess(result);
    } catch (error) {
      this.wrapAndThrowError(error);
    }
  }

  @Get()
  async findAll(@Query() query: Record<string, string | string[] | undefined>) {
    try {
      const limit = Number(query.limit ?? 10);
      const skip = Number(query.skip ?? 0);
      const statusParam =
        typeof query.status === 'string' ? query.status : undefined;
      const status = statusParam && Object.values(SubmissionStatus).includes(statusParam as SubmissionStatus)
        ? (statusParam as SubmissionStatus)
        : undefined;

      const result = await this.submissionsService.findAll({
        status,
        limit: Number.isNaN(limit) ? 10 : limit,
        skip: Number.isNaN(skip) ? 0 : skip
      });
      return this.wrapSuccess(result);
    } catch (error) {
      this.wrapAndThrowError(error);
    }
  }

  @Patch(':id/reject')
  async reject(
    @Param('id') id: string,
    @Body() payload: Record<string, unknown>
  ) {
    try {
      const rejectionReason =
        typeof payload.rejectionReason === 'string'
          ? payload.rejectionReason.trim()
          : '';
      if (!rejectionReason) {
        throw new BadRequestException('Rejection reason is required');
      }

      const result = await this.submissionsService.reject(id, {
        rejectionReason
      });
      return this.wrapSuccess(result);
    } catch (error) {
      this.wrapAndThrowError(error);
    }
  }

  @Patch(':id/accept')
  async accept(@Param('id') id: string) {
    try {
      const result = await this.submissionsService.accept(id);
      return this.wrapSuccess(result);
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
