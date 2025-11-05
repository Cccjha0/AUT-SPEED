import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ListClaimsQueryDto {
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
