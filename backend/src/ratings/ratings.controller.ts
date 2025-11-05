import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import type { CreateRatingDto } from './dto/create-rating.dto';
import type { GetRatingDto } from './dto/get-rating.dto';
import { RatingsService } from './ratings.service';

@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async create(@Body() payload: CreateRatingDto) {
    try {
      const data = await this.ratingsService.create(payload);
      return this.wrapSuccess(data);
    } catch (error) {
      this.wrapAndThrowError(error);
    }
  }

  @Get('avg')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async average(@Query() query: GetRatingDto) {
    try {
      const data = await this.ratingsService.average(query);
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
