import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdatePracticeDto {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  name?: string;
}
