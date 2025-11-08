import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min
} from 'class-validator';
import { Transform } from 'class-transformer';

const CURRENT_YEAR_LIMIT = new Date().getFullYear() + 1;
const DOI_REGEX = /^10\.\S+$/i;

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
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  volume?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  number?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  pages?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() || undefined : value))
  @Matches(DOI_REGEX, {
    message: 'DOI must be the identifier only (e.g. 10.1000/xyz123) without links.'
  })
  doi?: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  submittedBy!: string;

  @IsEmail()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  submitterEmail!: string;
}
