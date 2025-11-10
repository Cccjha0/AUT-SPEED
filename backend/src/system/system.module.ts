import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SystemState, SystemStateSchema } from './system-state.schema';
import { SystemStateService } from './system-state.service';
import { SystemController } from './system.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: SystemState.name, schema: SystemStateSchema }]),
    AuthModule
  ],
  controllers: [SystemController],
  providers: [SystemStateService],
  exports: [SystemStateService]
})
export class SystemModule {}
