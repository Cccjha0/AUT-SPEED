import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import type { CreateSubmissionDto } from './dto/create-submission.dto';
import type { ListSubmissionsQueryDto } from './dto/list-submissions.dto';
import type { RejectSubmissionDto } from './dto/reject-submission.dto';
import { SubmissionsService } from './submissions.service';

@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async create(@Body() payload: CreateSubmissionDto) {
    try {
      const result = await this.submissionsService.create(payload);
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
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async findAll(@Query() query: ListSubmissionsQueryDto) {
    try {
      const safeQuery = {
        ...query,
        limit: query.limit ?? 10,
        skip: query.skip ?? 0
      };

      const result = await this.submissionsService.findAll(safeQuery);
      return this.wrapSuccess(result);
    } catch (error) {
      this.wrapAndThrowError(error);
    }
  }

  @Patch(':id/reject')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async reject(@Param('id') id: string, @Body() payload: RejectSubmissionDto) {
    try {
      const result = await this.submissionsService.reject(id, payload);
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
