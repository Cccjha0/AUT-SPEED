import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min
} from 'class-validator';
import { EvidenceResult } from '../schemas/article-evidence.schema';

const CURRENT_YEAR_LIMIT = new Date().getFullYear() + 1;

export class ListEvidenceQueryDto {
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
  @IsInt()
  @Min(1900)
  @Max(CURRENT_YEAR_LIMIT)
  yearFrom?: number;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(CURRENT_YEAR_LIMIT)
  yearTo?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  limit?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  skip?: number;
}
