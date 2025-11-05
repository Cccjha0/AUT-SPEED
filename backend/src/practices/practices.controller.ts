import {
  Body,
  Controller,
  Delete,
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
import type { CreatePracticeDto } from './dto/create-practice.dto';
import type { ListPracticesQueryDto } from './dto/list-practices.dto';
import type { UpdatePracticeDto } from './dto/update-practice.dto';
import { PracticesService } from './practices.service';

@Controller('practices')
export class PracticesController {
  constructor(private readonly practicesService: PracticesService) {}

  @Get()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async list(@Query() query: ListPracticesQueryDto) {
    try {
      const safeQuery = {
        limit: query.limit ?? 10,
        skip: query.skip ?? 0
      };
      const data = await this.practicesService.findAll(safeQuery);
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
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async create(@Body() payload: CreatePracticeDto) {
    try {
      const data = await this.practicesService.create(payload);
      return this.wrapSuccess(data);
    } catch (error) {
      this.wrapAndThrowError(error);
    }
  }

  @Patch(':key')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async update(@Param('key') key: string, @Body() payload: UpdatePracticeDto) {
    try {
      const data = await this.practicesService.update(key, payload);
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
      throw new HttpException({ error: true, message }, status);
    }

    throw new HttpException(
      { error: true, message: 'Request failed' },
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}
