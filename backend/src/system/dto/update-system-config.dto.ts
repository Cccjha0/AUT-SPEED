import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSystemConfigDto {
  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;

  @IsOptional()
  @IsBoolean()
  submissionsOpen?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  announcement?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  supportEmail?: string;
}
