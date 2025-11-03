import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min
} from 'class-validator';

const CURRENT_YEAR_LIMIT = new Date().getFullYear() + 1;

export class CreateSubmissionDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  authors!: string[];

  @IsString()
  @IsNotEmpty()
  venue!: string;

  @IsInt()
  @Min(1900)
  @Max(CURRENT_YEAR_LIMIT)
  year!: number;

  @IsOptional()
  @IsString()
  volume?: string;

  @IsOptional()
  @IsString()
  number?: string;

  @IsOptional()
  @IsString()
  pages?: string;

  @IsOptional()
  @IsString()
  doi?: string;

  @IsOptional()
  @IsString()
  submittedBy?: string;
}
