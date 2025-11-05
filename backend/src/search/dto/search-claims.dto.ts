import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class SearchClaimsDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  query?: string;

  @IsOptional()
  @IsString()
  practiceKey?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  limit?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  skip?: number;
}
