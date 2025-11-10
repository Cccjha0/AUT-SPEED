import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SystemState, SystemStateSchema } from './system-state.schema';
import { SystemStateService } from './system-state.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: SystemState.name, schema: SystemStateSchema }])
  ],
  providers: [SystemStateService],
  exports: [SystemStateService]
})
export class SystemModule {}
