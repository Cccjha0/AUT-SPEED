import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateClaimDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  practiceKey?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  text?: string;
}
