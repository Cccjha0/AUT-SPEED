import { IsNotEmpty, IsString } from 'class-validator';
import { ModerationDecisionDto } from './moderation-decision.dto';

export class RejectSubmissionDto extends ModerationDecisionDto {
  @IsString()
  @IsNotEmpty()
  rejectionReason!: string;
}
