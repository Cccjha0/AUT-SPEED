import { Controller } from '@nestjs/common';
import { EvidenceService } from './evidence.service';

@Controller('evidence')
export class EvidenceController {
  constructor(private readonly _evidenceService: EvidenceService) {}
}
