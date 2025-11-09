import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  Max
} from 'class-validator';
import {
  EvidenceMethodType,
  EvidenceParticipantType,
  EvidenceResult
} from '../../evidence/schemas/article-evidence.schema';

const CURRENT_YEAR_LIMIT = new Date().getFullYear() + 1;

export enum EvidenceSortField {
  CreatedAt = 'createdAt',
  Year = 'year',
  Author = 'author',
  AvgRating = 'avgRating',
  Practice = 'practiceKey',
  Claim = 'claimKey',
  Result = 'result',
  Method = 'methodType',
  Participant = 'participantType'
}

export enum SortDirection {
  Asc = 'asc',
  Desc = 'desc'
}

export class SearchEvidenceDto {
  @IsOptional()
  @IsString()
  practiceKey?: string;

  @IsOptional()
  @IsString()
  claimKey?: string;

  @IsOptional()
  @IsEnum(EvidenceResult)
  result?: EvidenceResult;

  @IsOptional()
  @IsEnum(EvidenceMethodType)
  methodType?: EvidenceMethodType;

  @IsOptional()
  @IsEnum(EvidenceParticipantType)
  participantType?: EvidenceParticipantType;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(CURRENT_YEAR_LIMIT)
  from?: number;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(CURRENT_YEAR_LIMIT)
  to?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  limit?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  skip?: number;

  @IsOptional()
  @IsEnum(EvidenceSortField)
  sortBy?: EvidenceSortField;

  @IsOptional()
  @IsEnum(SortDirection)
  sortDirection?: SortDirection;
}
