import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query
} from '@nestjs/common';
import { EvidenceService } from './evidence.service';
import {
  EvidenceMethodType,
  EvidenceParticipantType,
  EvidenceResult
} from './schemas/article-evidence.schema';

@Controller('evidence')
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  @Post()
  async create(@Body() payload: Record<string, unknown>) {
    try {
      const articleDoi =
        typeof payload.articleDoi === 'string' ? payload.articleDoi.trim() : '';
      const practiceKey =
        typeof payload.practiceKey === 'string'
          ? payload.practiceKey.trim()
          : '';
      const claimKey =
        typeof payload.claimKey === 'string' ? payload.claimKey.trim() : '';
      const resultInput =
        typeof payload.result === 'string' ? payload.result.trim() : '';
      const methodTypeInput =
        typeof payload.methodType === 'string' ? payload.methodType.trim() : '';
      const participantTypeInput =
        typeof payload.participantType === 'string'
          ? payload.participantType.trim()
          : undefined;
      const notes =
        typeof payload.notes === 'string' ? payload.notes.trim() : undefined;
      const analyst =
        typeof payload.analyst === 'string'
          ? payload.analyst.trim()
          : undefined;

      if (!articleDoi || !practiceKey || !claimKey) {
        throw new BadRequestException(
          'Evidence requires articleDoi, practiceKey, and claimKey'
        );
      }

      const result = this.parseEnum(resultInput, EvidenceResult, 'result');
      const methodType = this.parseEnum(
        methodTypeInput,
        EvidenceMethodType,
        'methodType'
      );
      const participantType = participantTypeInput
        ? this.parseEnum(
            participantTypeInput,
            EvidenceParticipantType,
            'participantType'
          )
        : undefined;

      const data = await this.evidenceService.create({
        articleDoi,
        practiceKey,
        claimKey,
        result,
        methodType,
        participantType,
        notes,
        analyst
      });
      return this.wrapSuccess(data);
    } catch (error) {
      this.wrapAndThrowError(error);
    }
  }

  @Get()
  async list(
    @Query()
    query: Record<string, string | string[] | undefined>
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
      const from = this.parseYear(query.yearFrom);
      const to = this.parseYear(query.yearTo);

      if (from !== undefined && to !== undefined && from > to) {
        throw new BadRequestException('`yearFrom` cannot exceed `yearTo`');
      };

      const data = await this.evidenceService.findAll({
        practiceKey,
        claimKey,
        result,
        yearFrom: from,
        yearTo: to,
        limit,
        skip
      });
      return this.wrapSuccess(data);
    } catch (error) {
      this.wrapAndThrowError(error);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const data = await this.evidenceService.findById(id);
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
      const message = Array.isArray(rawMessage)
        ? rawMessage.join(', ')
        : rawMessage;
      throw new HttpException({ data: null, error: { message } }, status);
    }

    throw new HttpException(
      { data: null, error: { message: 'Request failed' } },
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  private parseEnum<T extends Record<string, string>>(
    value: string,
    enumObj: T,
    field: string
  ): T[keyof T] {
    const values = Object.values(enumObj) as string[];
    if (!values.includes(value)) {
      throw new BadRequestException(
        `${field} must be one of: ${values.join(', ')}`
      );
    }
    return value as T[keyof T];
  }

  private parsePositiveInt(
    raw: string | string[] | undefined,
    fallback: number
  ) {
    if (Array.isArray(raw)) {
      return fallback;
    }
    if (raw === undefined) {
      return fallback;
    }
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) {
      return fallback;
    }
    return value;
  }

  private parseYear(raw: string | string[] | undefined) {
    if (Array.isArray(raw) || raw === undefined) {
      return undefined;
    }
    const value = Number(raw);
    const currentMax = new Date().getFullYear() + 1;
    if (!Number.isFinite(value) || value < 1900 || value > currentMax) {
      throw new BadRequestException('Year filters must be between 1900 and next year');
    }
    return value;
  }
}

