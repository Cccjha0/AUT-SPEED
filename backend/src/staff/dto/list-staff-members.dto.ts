import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { normalizeRole, toOptionalBoolean } from './shared-transforms';

export class ListStaffMembersQueryDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => normalizeRole(value))
  role?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => toOptionalBoolean(value))
  active?: boolean;
}
