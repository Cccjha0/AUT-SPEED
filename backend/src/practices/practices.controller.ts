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
import { PracticesService } from './practices.service';

@Controller('practices')
export class PracticesController {
  constructor(private readonly practicesService: PracticesService) {}

  @Get()
  async list(@Query() query: Record<string, string | string[] | undefined>) {
    try {
      const limit = this.parsePositiveInt(query.limit, 10);
      const skip = this.parsePositiveInt(query.skip, 0);
      const data = await this.practicesService.findAll({
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
      const data = await this.practicesService.findByKey(key);
      return this.wrapSuccess(data);
    } catch (error) {
      this.wrapAndThrowError(error);
    }
  }

  @Post()
  async create(@Body() payload: Record<string, unknown>) {
    try {
      const key = typeof payload.key === 'string' ? payload.key.trim() : '';
      const name = typeof payload.name === 'string' ? payload.name.trim() : '';

      if (!key || !name) {
        throw new BadRequestException('Practice key and name are required');
      }

      const data = await this.practicesService.create({ key, name });
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
      const name =
        typeof payload.name === 'string' ? payload.name.trim() : undefined;

      const data = await this.practicesService.update(key, { name });
      return this.wrapSuccess(data);
    } catch (error) {
      this.wrapAndThrowError(error);
    }
  }

  @Delete(':key')
  async remove(@Param('key') key: string) {
    try {
      const data = await this.practicesService.delete(key);
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

