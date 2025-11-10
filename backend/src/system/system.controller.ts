import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SystemStateService } from './system-state.service';
import { UpdateSystemConfigDto } from './dto/update-system-config.dto';

@UseGuards(RolesGuard)
@Roles('admin')
@Controller('system')
export class SystemController {
  constructor(private readonly systemState: SystemStateService) {}

  @Get('config')
  async getConfig() {
    const data = await this.systemState.getConfig();
    return { data, error: null };
  }

  @Patch('config')
  async updateConfig(@Body() payload: UpdateSystemConfigDto) {
    const data = await this.systemState.updateConfig(payload);
    return { data, error: null };
  }
}
