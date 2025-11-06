import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query
} from '@nestjs/common';
import { RatingsService } from './ratings.service';

@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  async create(@Body() payload: Record<string, unknown>) {
    try {
      const doi =
        typeof payload.doi === 'string' ? payload.doi.trim() : '';
      const starsRaw =
        typeof payload.stars === 'number'
          ? payload.stars
          : Number(payload.stars ?? Number.NaN);
      const user =
        typeof payload.user === 'string' ? payload.user.trim() : undefined;

      if (!doi) {
        throw new BadRequestException('Rating requires a DOI');
      }

      if (!Number.isInteger(starsRaw) || starsRaw < 1 || starsRaw > 5) {
        throw new BadRequestException('Stars must be an integer between 1 and 5');
      }

      const data = await this.ratingsService.create({
        doi,
        stars: starsRaw,
        user
      });
      return this.wrapSuccess(data);
    } catch (error) {
      this.wrapAndThrowError(error);
    }
  }

  @Get('avg')
  async average(
    @Query() query: Record<string, string | string[] | undefined>
  ) {
    try {
      const doi =
        typeof query.doi === 'string' ? query.doi.trim() : undefined;
      if (!doi) {
        throw new BadRequestException('Query requires a DOI');
      }

      const data = await this.ratingsService.average({ doi });
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

