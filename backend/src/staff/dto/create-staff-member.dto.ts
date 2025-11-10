import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString
} from 'class-validator';
import {
  normalizeEmail,
  normalizeName,
  normalizeRoles,
  toOptionalBoolean
} from './shared-transforms';

export class CreateStaffMemberDto {
  @IsEmail()
  @Transform(({ value }) => normalizeEmail(value))
  email!: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => normalizeName(value))
  name?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @Transform(({ value }) => normalizeRoles(value))
  roles!: string[];

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => toOptionalBoolean(value))
  active?: boolean;
}
