
import {
  BadRequestException,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Query
} from '@nestjs/common';
import { SearchService } from './search.service';
import { EvidenceResult } from '../evidence/schemas/article-evidence.schema';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('practices')
  async practices(
    @Query() query: Record<string, string | string[] | undefined>
  ) {
    try {
      const limit = this.parsePositiveInt(query.limit, 10);
      const skip = this.parsePositiveInt(query.skip, 0);
      const text =
        typeof query.query === 'string' ? query.query.trim() : undefined;

      const data = await this.searchService.searchPractices({
        query: text,
        limit,
        skip
      });
      return this.wrapSuccess(data);
    } catch (error) {
      this.wrapAndThrowError(error);
    }
  }

  @Get('claims')
  async claims(
    @Query() query: Record<string, string | string[] | undefined>
  ) {
    try {
      const limit = this.parsePositiveInt(query.limit, 10);
      const skip = this.parsePositiveInt(query.skip, 0);
      const text =
        typeof query.query === 'string' ? query.query.trim() : undefined;
      const practiceKey =
        typeof query.practiceKey === 'string'
          ? query.practiceKey.trim()
          : undefined;

      const data = await this.searchService.searchClaims({
        practiceKey,
        query: text,
        limit,
        skip
      });
      return this.wrapSuccess(data);
    } catch (error) {
      this.wrapAndThrowError(error);
    }
  }

  @Get('evidence')
  async evidence(
    @Query() query: Record<string, string | string[] | undefined>
  ) {
    try {
      const limit = this.parsePositiveInt(query.limit, 10);
      const skip = this.parsePositiveInt(query.skip, 0);
      const practiceKey =
        typeof query.practiceKey === 'string'
          ? query.practiceKey.trim()
          : undefined;
      const claimKey =
        typeof query.claimKey === 'string'
          ? query.claimKey.trim()
          : undefined;
      const result =
        typeof query.result === 'string' && query.result
          ? this.parseEnum(query.result, EvidenceResult, 'result')
          : undefined;
      const yearFrom = this.parseYear(query.from);
      const yearTo = this.parseYear(query.to);

      if (yearFrom !== undefined && yearTo !== undefined && yearFrom > yearTo) {
        throw new BadRequestException('`from` year cannot exceed `to` year');
      }

      const data = await this.searchService.searchEvidence({
        practiceKey,
        claimKey,
        result,
        from: yearFrom,
        to: yearTo,
        limit,
        skip
      });
      return this.wrapSuccess(data);
    } catch (error) {
      this.wrapAndThrowError(error);
    }
  }

  @Get('ratings/avg')
  async averageRating(
    @Query() query: Record<string, string | string[] | undefined>
  ) {
    try {
      const doi =
        typeof query.doi === 'string' ? query.doi.trim() : undefined;
      if (!doi) {
        throw new BadRequestException('Query requires a DOI');
      }

      const data = await this.searchService.averageRating({ doi });
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

  private parseEnum<T extends Record<string, string>>(
    raw: string,
    enumObj: T,
    field: string
  ): T[keyof T] {
    const normalized = raw.trim();
    const allowed = Object.values(enumObj) as string[];
    if (!allowed.includes(normalized)) {
      throw new BadRequestException(
        `${field} must be one of: ${allowed.join(', ')}`
      );
    }
    return normalized as T[keyof T];
  }

  private parseYear(raw: string | string[] | undefined) {
    if (Array.isArray(raw) || raw === undefined) {
      return undefined;
    }
    if (!raw.trim()) {
      return undefined;
    }
    const value = Number(raw);
    const maxYear = new Date().getFullYear() + 1;
    if (!Number.isFinite(value) || value < 1900 || value > maxYear) {
      throw new BadRequestException(
        `Year must be between 1900 and ${maxYear}`
      );
    }
    return Math.floor(value);
  }
}

