import { BadRequestException, Injectable } from '@nestjs/common';
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
    const payload = {
      articleDoi: dto.doi,
      stars: dto.stars,
      user: dto.user
    };

    try {
      if (dto.user) {
        const updated = await this.ratingModel
          .findOneAndUpdate(
            { articleDoi: dto.doi, user: dto.user },
            payload,
            {
              new: true,
              upsert: true,
              runValidators: true,
              setDefaultsOnInsert: true
            }
          )
          .lean();

        return updated!;
      }

      const rating = new this.ratingModel(payload);
      const doc = await rating.save();
      return doc.toObject();
    } catch (error) {
      return this.handleMongooseError(error);
    }
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

  private handleMongooseError(error: unknown): never {
    if (this.isValidationError(error)) {
      throw new BadRequestException('Invalid rating payload');
    }

    if (this.isDuplicateKeyError(error)) {
      throw new BadRequestException('Rating already exists for this DOI and user');
    }

    throw new BadRequestException('Unable to process rating');
  }

  private isValidationError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      (error as { name?: string }).name === 'ValidationError'
    );
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    );
  }
}
