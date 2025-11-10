import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards
} from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { StaffService } from './staff.service';
import { CreateStaffMemberDto } from './dto/create-staff-member.dto';
import { UpdateStaffMemberDto } from './dto/update-staff-member.dto';
import { ListStaffMembersQueryDto } from './dto/list-staff-members.dto';

@UseGuards(RolesGuard)
@Roles('admin')
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  async list(@Query() query: ListStaffMembersQueryDto) {
    const data = await this.staffService.findAll(query);
    return { data, error: null };
  }

  @Post()
  async create(@Body() payload: CreateStaffMemberDto) {
    const data = await this.staffService.create(payload);
    return { data, error: null };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() payload: UpdateStaffMemberDto) {
    const data = await this.staffService.update(id, payload);
    return { data, error: null };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const data = await this.staffService.remove(id);
    return { data, error: null };
  }
}
