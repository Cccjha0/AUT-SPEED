import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import {
  EvidenceMethodType,
  EvidenceParticipantType,
  EvidenceResult
} from '../schemas/article-evidence.schema';

export class CreateEvidenceDto {
  @IsString()
  @IsNotEmpty()
  articleDoi!: string;

  @IsString()
  @IsNotEmpty()
  practiceKey!: string;

  @IsString()
  @IsNotEmpty()
  claimKey!: string;

  @IsEnum(EvidenceResult)
  result!: EvidenceResult;

  @IsEnum(EvidenceMethodType)
  methodType!: EvidenceMethodType;

  @IsOptional()
  @IsEnum(EvidenceParticipantType)
  participantType?: EvidenceParticipantType;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  analyst?: string;
}
