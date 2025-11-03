import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { SubmissionStatus } from '../schemas/article-submission.schema';

export class ListSubmissionsQueryDto {
  @IsOptional()
  @IsEnum(SubmissionStatus)
  status?: SubmissionStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  limit?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  skip?: number;
}
