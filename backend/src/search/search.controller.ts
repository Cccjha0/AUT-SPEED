
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
import { SearchService, EvidenceFilterSnapshot } from './search.service';
import {
  EvidenceMethodType,
  EvidenceParticipantType,
  EvidenceResult
} from '../evidence/schemas/article-evidence.schema';

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
      const methodType =
        typeof query.methodType === 'string' && query.methodType
          ? this.parseEnum(query.methodType, EvidenceMethodType, 'methodType')
          : undefined;
      const participantType =
        typeof query.participantType === 'string' && query.participantType
          ? this.parseEnum(
              query.participantType,
              EvidenceParticipantType,
              'participantType'
            )
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
        methodType,
        participantType,
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

  @Get('saved')
  async savedQueries(
    @Query() query: Record<string, string | string[] | undefined>
  ) {
    try {
      const owner =
        typeof query.owner === 'string' ? query.owner.trim().toLowerCase() : '';
      if (!owner) {
        throw new BadRequestException('`owner` query parameter is required');
      }
      const limit = this.parsePositiveInt(query.limit, 50);
      const data = await this.searchService.listSavedQueries(owner, limit);
      return this.wrapSuccess(data);
    } catch (error) {
      this.wrapAndThrowError(error);
    }
  }

  @Post('saved')
  async saveQuery(@Body() body: Record<string, unknown>) {
    try {
      const owner = this.extractNonEmptyString(body.owner, 'owner').toLowerCase();
      const name = this.extractNonEmptyString(body.name, 'name');
      const filters = this.parseSavedFilters(body.query);
      const saved = await this.searchService.saveQuery({
        owner,
        name,
        query: filters
      });
      return this.wrapSuccess(saved);
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

  private extractNonEmptyString(value: unknown, field: string) {
    if (typeof value !== 'string') {
      throw new BadRequestException(`${field} is required`);
    }
    const trimmed = value.trim();
    if (!trimmed) {
      throw new BadRequestException(`${field} is required`);
    }
    return trimmed;
  }

  private parseSavedFilters(raw: unknown): EvidenceFilterSnapshot {
    if (typeof raw !== 'object' || raw === null) {
      throw new BadRequestException('query must be an object');
    }
    const source = raw as Record<string, unknown>;
    const filters: EvidenceFilterSnapshot = {};
    const practiceKey = this.optionalString(source.practiceKey);
    const claimKey = this.optionalString(source.claimKey);
    if (practiceKey) {
      filters.practiceKey = practiceKey;
    }
    if (claimKey) {
      filters.claimKey = claimKey;
    }
    if (typeof source.result === 'string' && source.result.trim()) {
      filters.result = this.parseEnum(
        source.result,
        EvidenceResult,
        'result'
      );
    }
    if (typeof source.methodType === 'string' && source.methodType.trim()) {
      filters.methodType = this.parseEnum(
        source.methodType,
        EvidenceMethodType,
        'methodType'
      );
    }
    if (
      typeof source.participantType === 'string' &&
      source.participantType.trim()
    ) {
      filters.participantType = this.parseEnum(
        source.participantType,
        EvidenceParticipantType,
        'participantType'
      );
    }
    const yearFrom = this.parseFlexibleYear(source.from);
    const yearTo = this.parseFlexibleYear(source.to);
    if (yearFrom !== undefined) {
      filters.from = yearFrom;
    }
    if (yearTo !== undefined) {
      filters.to = yearTo;
    }

    if (!Object.keys(filters).length) {
      throw new BadRequestException('query must include at least one filter');
    }

    return this.searchService.sanitizeFiltersForSave(filters);
  }

  private optionalString(value: unknown) {
    if (typeof value !== 'string') {
      return undefined;
    }
    const trimmed = value.trim();
    return trimmed || undefined;
  }

  private parseFlexibleYear(value: unknown) {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }
    const numeric =
      typeof value === 'number' ? value : Number(String(value));
    const maxYear = new Date().getFullYear() + 1;
    if (!Number.isFinite(numeric) || numeric < 1900 || numeric > maxYear) {
      throw new BadRequestException(
        `Year must be between 1900 and ${maxYear}`
      );
    }
    return Math.floor(numeric);
  }
}

