import { IsInt, IsOptional, Min } from 'class-validator';

export class ListPracticesQueryDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  limit?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  skip?: number;
}
