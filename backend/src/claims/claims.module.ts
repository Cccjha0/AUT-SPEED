import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Practice, PracticeSchema } from '../practices/schemas/practice.schema';
import { ClaimsController } from './claims.controller';
import { ClaimsService } from './claims.service';
import { Claim, ClaimSchema } from './schemas/claim.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Claim.name, schema: ClaimSchema },
      { name: Practice.name, schema: PracticeSchema }
    ])
  ],
  controllers: [ClaimsController],
  providers: [ClaimsService],
  exports: [ClaimsService]
})
export class ClaimsModule {}
