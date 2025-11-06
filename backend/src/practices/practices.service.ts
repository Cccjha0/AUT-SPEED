import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { instanceToPlain } from 'class-transformer';
import type { FilterQuery, Model } from 'mongoose';
import type { CreatePracticeDto } from './dto/create-practice.dto';
import type { ListPracticesQueryDto } from './dto/list-practices.dto';
import type { UpdatePracticeDto } from './dto/update-practice.dto';
import { Practice, PracticeDocument } from './schemas/practice.schema';

@Injectable()
export class PracticesService {
  constructor(
    @InjectModel(Practice.name)
    private readonly practiceModel: Model<PracticeDocument>
  ) {}

  async findAll(query: ListPracticesQueryDto) {
    const { limit = 10, skip = 0 } = query;
    const safeLimit = Math.min(Math.max(limit, 0), 100);
    const safeSkip = Math.max(skip, 0);

    const filter: FilterQuery<PracticeDocument> = {};

    const [items, total] = await Promise.all([
      this.practiceModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(safeSkip)
        .limit(safeLimit)
        .lean(),
      this.practiceModel.countDocuments(filter)
    ]);

    return {
      items,
      total,
      limit: safeLimit,
      skip: safeSkip
    };
  }

  async findByKey(key: string) {
    const practice = await this.practiceModel.findOne({ key }).lean();
    if (!practice) {
      throw new NotFoundException('Practice not found');
    }
    return practice;
  }

  async create(dto: CreatePracticeDto) {
    if (!dto?.key || !dto?.name) {
      throw new BadRequestException('Practice key and name are required');
    }
    const practice = new this.practiceModel(instanceToPlain(dto));
    try {
      const saved = await practice.save();
      return saved.toObject();
    } catch (error) {
      this.handleMongooseError(error, 'Practice key already exists');
    }
  }

  async update(key: string, dto: UpdatePracticeDto) {
    if (!dto.name) {
      throw new BadRequestException('No updates provided');
    }

    const updated = await this.practiceModel
      .findOneAndUpdate(
        { key },
        { $set: { name: dto.name } },
        {
          new: true,
          runValidators: true
        }
      )
      .lean();

    if (!updated) {
      throw new NotFoundException('Practice not found');
    }

    return updated;
  }

  async delete(key: string) {
    const deleted = await this.practiceModel.findOneAndDelete({ key }).lean();
    if (!deleted) {
      throw new NotFoundException('Practice not found');
    }
    return deleted;
  }

  private handleMongooseError(error: unknown, message: string): never {
    if (this.isDuplicateKeyError(error)) {
      throw new BadRequestException(message);
    }

    if (error instanceof Error) {
      throw new BadRequestException(error.message);
    }

    throw new BadRequestException('Unable to process practice');
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
