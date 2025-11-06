import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query
} from '@nestjs/common';
import { ClaimsService } from './claims.service';

@Controller('claims')
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Get()
  async list(@Query() query: Record<string, string | string[] | undefined>) {
    try {
      const practiceKey =
        typeof query.practiceKey === 'string'
          ? query.practiceKey.trim()
          : undefined;
      const limit = this.parsePositiveInt(query.limit, 10);
      const skip = this.parsePositiveInt(query.skip, 0);

      const data = await this.claimsService.findAll({
        practiceKey,
        limit,
        skip
      });
      return this.wrapSuccess(data);
    } catch (error) {
      this.wrapAndThrowError(error);
    }
  }

  @Get(':key')
  async findOne(@Param('key') key: string) {
    try {
      const data = await this.claimsService.findByKey(key);
      return this.wrapSuccess(data);
    } catch (error) {
      this.wrapAndThrowError(error);
    }
  }

  @Post()
  async create(@Body() payload: Record<string, unknown>) {
    try {
      const key = typeof payload.key === 'string' ? payload.key.trim() : '';
      const practiceKey =
        typeof payload.practiceKey === 'string'
          ? payload.practiceKey.trim()
          : '';
      const text =
        typeof payload.text === 'string' ? payload.text.trim() : '';

      if (!key || !practiceKey || !text) {
        throw new BadRequestException(
          'Claim key, practiceKey, and text are required'
        );
      }

      const data = await this.claimsService.create({ key, practiceKey, text });
      return this.wrapSuccess(data);
    } catch (error) {
      this.wrapAndThrowError(error);
    }
  }

  @Patch(':key')
  async update(
    @Param('key') key: string,
    @Body() payload: Record<string, unknown>
  ) {
    try {
      const practiceKey =
        typeof payload.practiceKey === 'string'
          ? payload.practiceKey.trim()
          : undefined;
      const text =
        typeof payload.text === 'string' ? payload.text.trim() : undefined;

      const data = await this.claimsService.update(key, { practiceKey, text });
      return this.wrapSuccess(data);
    } catch (error) {
      this.wrapAndThrowError(error);
    }
  }

  @Delete(':key')
  async remove(@Param('key') key: string) {
    try {
      const data = await this.claimsService.delete(key);
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
      const rawMessage =
        typeof response === 'string'
          ? response
          : (response as Record<string, unknown>).message ?? 'Request failed';
      const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage;
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
