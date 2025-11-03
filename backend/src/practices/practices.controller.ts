import { Controller } from '@nestjs/common';
import { PracticesService } from './practices.service';

@Controller('practices')
export class PracticesController {
  constructor(private readonly _practicesService: PracticesService) {}
}
