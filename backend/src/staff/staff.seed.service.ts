import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { StaffService } from './staff.service';

@Injectable()
export class StaffSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(StaffSeedService.name);

  constructor(private readonly staffService: StaffService) {}

  async onApplicationBootstrap() {
    const result = await this.staffService.seedFromEnvIfEmpty();
    if (result.inserted > 0) {
      this.logger.log(`Seeded ${result.inserted} staff member(s) from environment variables`);
    }
  }
}
