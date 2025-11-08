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
import { ModerationDecisionDto } from './dto/moderation-decision.dto';
import { RejectSubmissionDto } from './dto/reject-submission.dto';

const DOI_REGEX = /^10\.\S+$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DOI_ERROR =
  'DOI must be the identifier only (e.g. 10.1000/xyz123) without links.';

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
      const doiRaw =
        typeof payload.doi === 'string' ? payload.doi.trim() : '';
      const submittedBy =
        typeof payload.submittedBy === 'string'
          ? payload.submittedBy.trim()
          : '';
      const submitterEmail =
        typeof payload.submitterEmail === 'string'
          ? payload.submitterEmail.trim()
          : '';

      const hasForbiddenDoiPrefix =
        /^https?:\/\//i.test(doiRaw) ||
        /^doi:/i.test(doiRaw) ||
        /doi\.org/i.test(doiRaw);
      const doi = doiRaw ? doiRaw.trim() : undefined;

      if (
        !title ||
        !authors.length ||
        !venue ||
        Number.isNaN(year) ||
        !submittedBy ||
        !submitterEmail
      ) {
        throw new BadRequestException(
          'Submission requires contact info (name/email) and complete citation metadata'
        );
      }

      if (hasForbiddenDoiPrefix) {
        throw new BadRequestException(DOI_ERROR);
      }

      if (doi && !DOI_REGEX.test(doi)) {
        throw new BadRequestException(DOI_ERROR);
      }

      if (!EMAIL_REGEX.test(submitterEmail)) {
        throw new BadRequestException('A valid submitter email is required');
      }

      const result = await this.submissionsService.create({
        title,
        authors,
        venue,
        year,
        doi,
        submittedBy,
        submitterEmail
      });
      return this.wrapSuccess(result);
    } catch (error) {
      this.wrapAndThrowError(error);
    }
  }

  @Get('check')
  async check(@Query('doi') doi?: string) {
    try {
      if (!doi || !doi.trim()) {
        return this.wrapSuccess({ exists: false });
      }
      const trimmed = doi.trim();
      const hasForbidden =
        /^https?:\/\//i.test(trimmed) ||
        /^doi:/i.test(trimmed) ||
        /doi\.org/i.test(trimmed);
      if (hasForbidden || !DOI_REGEX.test(trimmed)) {
        return this.wrapSuccess({ exists: false });
      }
      const result = await this.submissionsService.checkByDoi(trimmed);
      return this.wrapSuccess(result);
    } catch (error) {
      this.wrapAndThrowError(error);
    }
  }

  @Get('rejections')
  async listRejections(
    @Query() query: Record<string, string | string[] | undefined>
  ) {
    try {
      const q = typeof query.query === 'string' ? query.query.trim() : undefined;
      const yearParam =
        typeof query.year === 'string' ? Number(query.year) : undefined;
      const limitParam =
        typeof query.limit === 'string' ? Number(query.limit) : undefined;
      const skipParam =
        typeof query.skip === 'string' ? Number(query.skip) : undefined;
      const result = await this.submissionsService.listRejections({
        query: q,
        year: Number.isFinite(yearParam) ? (yearParam as number) : undefined,
        limit: Number.isFinite(limitParam) ? (limitParam as number) : undefined,
        skip: Number.isFinite(skipParam) ? (skipParam as number) : undefined
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
    @Body() payload: RejectSubmissionDto
  ) {
    try {
      const reason = payload.rejectionReason?.trim();
      if (!reason) {
        throw new BadRequestException('Rejection reason is required');
      }
      const result = await this.submissionsService.reject(id, {
        ...payload,
        rejectionReason: reason
      });
      return this.wrapSuccess(result);
    } catch (error) {
      this.wrapAndThrowError(error);
    }
  }

  @Patch(':id/accept')
  async accept(
    @Param('id') id: string,
    @Body() payload: ModerationDecisionDto
  ) {
    try {
      const result = await this.submissionsService.accept(id, payload);
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
