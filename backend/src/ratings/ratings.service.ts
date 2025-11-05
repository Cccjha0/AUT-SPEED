import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { CreateRatingDto } from './dto/create-rating.dto';
import type { GetRatingDto } from './dto/get-rating.dto';
import type { UserRatingDocument } from './schemas/user-rating.schema';
import { UserRating } from './schemas/user-rating.schema';

@Injectable()
export class RatingsService {
  constructor(
    @InjectModel(UserRating.name)
    private readonly ratingModel: Model<UserRatingDocument>
  ) {}

  async create(dto: CreateRatingDto) {
    if (dto.user) {
      const existing = await this.ratingModel
        .findOne({ articleDoi: dto.doi, user: dto.user })
        .lean();
      if (existing) {
        throw new BadRequestException('User has already rated this article');
      }
    }
    const rating = new this.ratingModel({
      articleDoi: dto.doi,
      stars: dto.stars,
      user: dto.user
    });

    const doc = await rating.save();
    return doc.toObject();
  }

  async average(dto: GetRatingDto) {
    const { doi } = dto;

    const [stats] = await this.ratingModel
      .aggregate([
        { $match: { articleDoi: doi } },
        {
          $group: {
            _id: '$articleDoi',
            average: { $avg: '$stars' },
            count: { $sum: 1 }
          }
        }
      ])
      .exec();

    if (!stats) {
      return {
        doi,
        average: null,
        count: 0
      };
    }

    return {
      doi,
      average: stats.average,
      count: stats.count
    };
  }
}
