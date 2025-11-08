import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ModerationDecisionDto {
  @IsOptional()
  @IsBoolean()
  peerReviewed?: boolean;

  @IsOptional()
  @IsBoolean()
  seRelated?: boolean;

  @IsOptional()
  @IsString()
  decisionNotes?: string;
}
