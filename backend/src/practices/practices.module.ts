import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PracticesController } from './practices.controller';
import { PracticesService } from './practices.service';
import { Practice, PracticeSchema } from './schemas/practice.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Practice.name, schema: PracticeSchema }])
  ],
  controllers: [PracticesController],
  providers: [PracticesService],
  exports: [PracticesService]
})
export class PracticesModule {}
