import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { instanceToPlain } from 'class-transformer';
import type { FilterQuery, Model } from 'mongoose';
import { Types } from 'mongoose';
import type { CreateSubmissionDto } from './dto/create-submission.dto';
import type { ListSubmissionsQueryDto } from './dto/list-submissions.dto';
import type { RejectSubmissionDto } from './dto/reject-submission.dto';
import type { ModerationDecisionDto } from './dto/moderation-decision.dto';
import {
  ArticleSubmission,
  ArticleSubmissionDocument,
  SubmissionStatus,
  AnalysisStatus
} from './schemas/article-submission.schema';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectModel(ArticleSubmission.name)
    private readonly submissionModel: Model<ArticleSubmissionDocument>,
    private readonly notificationsService: NotificationsService
  ) {}

  async create(dto: CreateSubmissionDto) {
    if (!dto?.title || !dto?.authors?.length || !dto?.venue || typeof dto.year !== 'number') {
      throw new BadRequestException('Submission must include title, authors, venue, and year');
    }
    const currentYear = new Date().getFullYear() + 1;
    if (dto.year < 1900 || dto.year > currentYear) {
      throw new BadRequestException('Submission year out of range');
    }
    try {
      const created = new this.submissionModel(
        instanceToPlain({
          ...dto,
          analysisStatus: AnalysisStatus.None
        })
      );
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

  async accept(id: string, decision: ModerationDecisionDto = {}) {
    this.ensureValidId(id);
    try {
      const update: Record<string, unknown> = {
        status: SubmissionStatus.Accepted,
        lastDecisionAt: new Date(),
        $unset: { rejectionReason: '' }
      };
      if (decision.peerReviewed !== undefined) {
        update.peerReviewed = decision.peerReviewed;
      }
      if (decision.seRelated !== undefined) {
        update.seRelated = decision.seRelated;
      }
      if (decision.decisionNotes !== undefined) {
        update.decisionNotes = decision.decisionNotes;
      }
      update.analysisStatus = AnalysisStatus.Todo;
      update.assignedAnalyst = decision.decisionNotes
        ? update.assignedAnalyst
        : undefined;

      if (decision.peerReviewed !== undefined) {
        update.peerReviewed = decision.peerReviewed;
      }
      if (decision.seRelated !== undefined) {
        update.seRelated = decision.seRelated;
      }
      if (decision.decisionNotes !== undefined) {
        update.decisionNotes = decision.decisionNotes;
      }
      const updated = await this.submissionModel
        .findByIdAndUpdate(id, update, {
          new: true
        })
        .lean();

      if (!updated) {
        throw new NotFoundException('Submission not found');
      }

      void this.notificationsService.notifySubmissionDecision({
        email: updated.submitterEmail,
        name: updated.submittedBy,
        title: updated.title,
        status: SubmissionStatus.Accepted
      });

      return updated;
    } catch (error) {
      this.handleMongooseError(error);
    }
  }

  async reject(id: string, dto: RejectSubmissionDto) {
    this.ensureValidId(id);
    try {
      const update: Record<string, unknown> = {
        status: SubmissionStatus.Rejected,
        rejectionReason: dto.rejectionReason,
        lastDecisionAt: new Date(),
        analysisStatus: AnalysisStatus.None,
        $unset: {
          assignedAnalyst: '',
          analysisStartedAt: '',
          analysisCompletedAt: ''
        }
      };
      if (dto.peerReviewed !== undefined) {
        update.peerReviewed = dto.peerReviewed;
      }
      if (dto.seRelated !== undefined) {
        update.seRelated = dto.seRelated;
      }
      if (dto.decisionNotes !== undefined) {
        update.decisionNotes = dto.decisionNotes;
      }
      const updated = await this.submissionModel
        .findByIdAndUpdate(id, update, { new: true })
        .lean();

      if (!updated) {
        throw new NotFoundException('Submission not found');
      }

      void this.notificationsService.notifySubmissionDecision({
        email: updated.submitterEmail,
        name: updated.submittedBy,
        title: updated.title,
        status: SubmissionStatus.Rejected
      });

      return updated;
    } catch (error) {
      this.handleMongooseError(error);
    }
  }

  async listAnalysisQueue(query: {
    status?: AnalysisStatus;
    limit?: number;
    skip?: number;
  }) {
    const { status = AnalysisStatus.Todo, limit = 20, skip = 0 } = query;
    const safeLimit = Math.min(Math.max(limit, 0), 100);
    const safeSkip = Math.max(skip, 0);
    const filter: FilterQuery<ArticleSubmissionDocument> = {
      analysisStatus:
        status === AnalysisStatus.Todo
          ? { $in: [AnalysisStatus.Todo, AnalysisStatus.InProgress] }
          : status
    };
    const [items, total] = await Promise.all([
      this.submissionModel
        .find(filter)
        .sort({ analysisStatus: 1, updatedAt: -1 })
        .skip(safeSkip)
        .limit(safeLimit)
        .lean(),
      this.submissionModel.countDocuments(filter)
    ]);
    if (total > 0) {
      void this.notificationsService.notifyAnalysts(total);
    }
    return { items, total, limit: safeLimit, skip: safeSkip };
  }

  async assignAnalysis(doi: string, analystId: string) {
    const submission = await this.submissionModel
      .findOneAndUpdate(
        { doi: doi.toLowerCase() },
        {
          assignedAnalyst: analystId.trim(),
          analysisStatus: AnalysisStatus.Todo
        },
        { new: true }
      )
      .lean();
    if (!submission) {
      throw new NotFoundException('Submission not found');
    }
    return submission;
  }

  async startAnalysis(doi: string) {
    const submission = await this.submissionModel
      .findOneAndUpdate(
        { doi: doi.toLowerCase() },
        {
          analysisStatus: AnalysisStatus.InProgress,
          analysisStartedAt: new Date()
        },
        { new: true }
      )
      .lean();
    if (!submission) {
      throw new NotFoundException('Submission not found');
    }
    return submission;
  }

  async completeAnalysis(doi: string) {
    const submission = await this.submissionModel
      .findOneAndUpdate(
        { doi: doi.toLowerCase() },
        {
          analysisStatus: AnalysisStatus.Done,
          analysisCompletedAt: new Date()
        },
        { new: true }
      )
      .lean();
    if (!submission) {
      throw new NotFoundException('Submission not found');
    }
    return submission;
  }

  async checkByDoi(doi: string) {
    if (!doi) {
      return { exists: false };
    }
    const normalized = doi.trim().toLowerCase();
    const submission = await this.submissionModel
      .findOne({ doi: normalized })
      .lean();
    if (!submission) {
      return { exists: false };
    }
    return {
      exists: true,
      status: submission.status,
      lastDecisionAt:
        submission.lastDecisionAt ??
        submission.updatedAt ??
        submission.createdAt,
      decisionNotes: submission.decisionNotes ?? null
    };
  }

  async listRejections(params: {
    query?: string;
    year?: number;
    limit?: number;
    skip?: number;
  }) {
    const { query, year, limit = 10, skip = 0 } = params;
    const safeLimit = Math.min(Math.max(limit, 0), 100);
    const safeSkip = Math.max(skip, 0);
    const filter: FilterQuery<ArticleSubmissionDocument> = {
      status: SubmissionStatus.Rejected
    };
    if (year) {
      filter.year = year;
    }
    if (query) {
      const regex = new RegExp(query, 'i');
      filter.$or = [
        { title: regex },
        { authors: regex },
        { venue: regex },
        { doi: regex },
        { submittedBy: regex }
      ];
    }
    const [items, total] = await Promise.all([
      this.submissionModel
        .find(filter)
        .sort({ lastDecisionAt: -1, createdAt: -1 })
        .skip(safeSkip)
        .limit(safeLimit)
        .lean(),
      this.submissionModel.countDocuments(filter)
    ]);
    return { items, total, limit: safeLimit, skip: safeSkip };
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
