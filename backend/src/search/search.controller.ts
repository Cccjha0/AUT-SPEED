
import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Query,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import type { SearchPracticesDto } from './dto/search-practices.dto';
import type { SearchClaimsDto } from './dto/search-claims.dto';
import type { SearchEvidenceDto } from './dto/search-evidence.dto';
import type { SearchRatingsDto } from './dto/search-ratings.dto';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('practices')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async practices(@Query() query: SearchPracticesDto) {
    try {
      const data = await this.searchService.searchPractices(query);
      return this.wrapSuccess(data);
    } catch (error) {
      this.wrapAndThrowError(error);
    }
  }

  @Get('claims')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async claims(@Query() query: SearchClaimsDto) {
    try {
      const data = await this.searchService.searchClaims(query);
      return this.wrapSuccess(data);
    } catch (error) {
      this.wrapAndThrowError(error);
    }
  }

  @Get('evidence')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async evidence(@Query() query: SearchEvidenceDto) {
    try {
      const data = await this.searchService.searchEvidence(query);
      return this.wrapSuccess(data);
    } catch (error) {
      this.wrapAndThrowError(error);
    }
  }

  @Get('ratings/avg')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async averageRating(@Query() query: SearchRatingsDto) {
    try {
      const data = await this.searchService.averageRating(query);
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
