import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { StaffMember, StaffMemberSchema } from './schemas/staff-member.schema';
import { StaffSeedService } from './staff.seed.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: StaffMember.name, schema: StaffMemberSchema }]),
    AuthModule
  ],
  controllers: [StaffController],
  providers: [StaffService, StaffSeedService],
  exports: [StaffService]
})
export class StaffModule {}
