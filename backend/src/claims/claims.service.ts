import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { FilterQuery, Model } from 'mongoose';
import type { CreateClaimDto } from './dto/create-claim.dto';
import type { ListClaimsQueryDto } from './dto/list-claims.dto';
import type { UpdateClaimDto } from './dto/update-claim.dto';
import type { ClaimDocument } from './schemas/claim.schema';
import { Claim } from './schemas/claim.schema';
import type { PracticeDocument } from '../practices/schemas/practice.schema';
import { Practice } from '../practices/schemas/practice.schema';

@Injectable()
export class ClaimsService {
  constructor(
    @InjectModel(Claim.name)
    private readonly claimModel: Model<ClaimDocument>,
    @InjectModel(Practice.name)
    private readonly practiceModel: Model<PracticeDocument>
  ) {}

  async findAll(query: ListClaimsQueryDto) {
    const { practiceKey, limit = 10, skip = 0 } = query;
    const safeLimit = Math.min(Math.max(limit, 0), 100);
    const safeSkip = Math.max(skip, 0);

    const filter: FilterQuery<ClaimDocument> = {};
    if (practiceKey) {
      filter.practiceKey = practiceKey;
    }

    const [items, total] = await Promise.all([
      this.claimModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(safeSkip)
        .limit(safeLimit)
        .lean(),
      this.claimModel.countDocuments(filter)
    ]);

    return {
      items,
      total,
      limit: safeLimit,
      skip: safeSkip
    };
  }

  async findByKey(key: string) {
    const claim = await this.claimModel.findOne({ key }).lean();
    if (!claim) {
      throw new NotFoundException('Claim not found');
    }
    return claim;
  }

  async findByPractice(practiceKey: string, query: ListClaimsQueryDto) {
    return this.findAll({ ...query, practiceKey });
  }

  async create(dto: CreateClaimDto) {
    await this.ensurePracticeExists(dto.practiceKey);
    const claim = new this.claimModel(dto);

    try {
      const saved = await claim.save();
      return saved.toObject();
    } catch (error) {
      this.handleMongooseError(error, 'Claim key already exists');
    }
  }

  async update(key: string, dto: UpdateClaimDto) {
    if (!dto.practiceKey && !dto.text) {
      throw new BadRequestException('No updates provided');
    }

    if (dto.practiceKey) {
      await this.ensurePracticeExists(dto.practiceKey);
    }

    const updatePayload: Record<string, unknown> = {};
    if (dto.practiceKey) {
      updatePayload.practiceKey = dto.practiceKey;
    }
    if (dto.text) {
      updatePayload.text = dto.text;
    }

    const updated = await this.claimModel
      .findOneAndUpdate({ key }, { $set: updatePayload }, { new: true })
      .lean();

    if (!updated) {
      throw new NotFoundException('Claim not found');
    }

    return updated;
  }

  async delete(key: string) {
    const deleted = await this.claimModel.findOneAndDelete({ key }).lean();
    if (!deleted) {
      throw new NotFoundException('Claim not found');
    }
    return deleted;
  }

  private async ensurePracticeExists(practiceKey: string) {
    const practiceExists = await this.practiceModel.exists({ key: practiceKey });
    if (!practiceExists) {
      throw new BadRequestException('Practice not found');
    }
  }

  private handleMongooseError(error: unknown, message: string): never {
    if (this.isDuplicateKeyError(error)) {
      throw new BadRequestException(message);
    }

    if (error instanceof Error) {
      throw new BadRequestException(error.message);
    }

    throw new BadRequestException('Unable to process claim');
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
