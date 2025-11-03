import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { FilterQuery, Model } from 'mongoose';
import { Types } from 'mongoose';
import type { CreateSubmissionDto } from './dto/create-submission.dto';
import type { ListSubmissionsQueryDto } from './dto/list-submissions.dto';
import type { RejectSubmissionDto } from './dto/reject-submission.dto';
import {
  ArticleSubmission,
  ArticleSubmissionDocument,
  SubmissionStatus
} from './schemas/article-submission.schema';

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectModel(ArticleSubmission.name)
    private readonly submissionModel: Model<ArticleSubmissionDocument>
  ) {}

  async create(dto: CreateSubmissionDto) {
    try {
      const created = new this.submissionModel(dto);
      const saved = await created.save();
      return saved.toObject();
    } catch (error) {
      this.handleMongooseError(error);
    }
  }

  async findById(id: string) {
    this.ensureValidId(id);
    const submission = await this.submissionModel.findById(id).lean();
    if (!submission) {
      throw new NotFoundException('Submission not found');
    }
    return submission;
  }

  async findAll(query: ListSubmissionsQueryDto) {
    const { status, limit = 10, skip = 0 } = query;
    const safeLimit = Math.min(Math.max(limit, 0), 100);
    const safeSkip = Math.max(skip, 0);

    const filter: FilterQuery<ArticleSubmissionDocument> = {};

    if (status) {
      filter.status = status;
    }

    const [items, total] = await Promise.all([
      this.submissionModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(safeSkip)
        .limit(safeLimit)
        .lean(),
      this.submissionModel.countDocuments(filter)
    ]);

    return {
      items,
      total,
      limit: safeLimit,
      skip: safeSkip
    };
  }

  async accept(id: string) {
    this.ensureValidId(id);
    try {
      const updated = await this.submissionModel
        .findByIdAndUpdate(
          id,
          {
            status: SubmissionStatus.Accepted,
            $unset: { rejectionReason: '' }
          },
          {
            new: true
          }
        )
        .lean();

      if (!updated) {
        throw new NotFoundException('Submission not found');
      }

      return updated;
    } catch (error) {
      this.handleMongooseError(error);
    }
  }

  async reject(id: string, dto: RejectSubmissionDto) {
    this.ensureValidId(id);
    try {
      const updated = await this.submissionModel
        .findByIdAndUpdate(
          id,
          {
            status: SubmissionStatus.Rejected,
            rejectionReason: dto.rejectionReason
          },
          { new: true }
        )
        .lean();

      if (!updated) {
        throw new NotFoundException('Submission not found');
      }

      return updated;
    } catch (error) {
      this.handleMongooseError(error);
    }
  }

  private ensureValidId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid submission id');
    }
  }

  private handleMongooseError(error: unknown): never {
    if (this.isDuplicateKeyError(error)) {
      throw new BadRequestException('Submission with this DOI already exists');
    }

    if (error instanceof BadRequestException || error instanceof NotFoundException) {
      throw error;
    }

    throw new BadRequestException('Unable to process submission');
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
