import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateRatingDto {
  @IsString()
  @IsNotEmpty()
  doi!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  stars!: number;

  @IsOptional()
  @IsString()
  user?: string;
}

