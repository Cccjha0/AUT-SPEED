import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RatingsController } from './ratings.controller';
import { RatingsService } from './ratings.service';
import { UserRating, UserRatingSchema } from './schemas/user-rating.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserRating.name, schema: UserRatingSchema }])
  ],
  controllers: [RatingsController],
  providers: [RatingsService],
  exports: [RatingsService]
})
export class RatingsModule {}
