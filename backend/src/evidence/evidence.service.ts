import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { FilterQuery, Model } from 'mongoose';
import { Types } from 'mongoose';
import type { ClaimDocument } from '../claims/schemas/claim.schema';
import { Claim } from '../claims/schemas/claim.schema';
import type { CreateEvidenceDto } from './dto/create-evidence.dto';
import type { ListEvidenceQueryDto } from './dto/list-evidence.dto';
import type { ArticleEvidenceDocument } from './schemas/article-evidence.schema';
import { ArticleEvidence, EvidenceMethodType } from './schemas/article-evidence.schema';
import type { PracticeDocument } from '../practices/schemas/practice.schema';
import { Practice } from '../practices/schemas/practice.schema';
import type { ArticleSubmissionDocument } from '../submissions/schemas/article-submission.schema';
import {
  ArticleSubmission,
  SubmissionStatus
} from '../submissions/schemas/article-submission.schema';

@Injectable()
export class EvidenceService {
  constructor(
    @InjectModel(ArticleEvidence.name)
    private readonly evidenceModel: Model<ArticleEvidenceDocument>,
    @InjectModel(ArticleSubmission.name)
    private readonly submissionModel: Model<ArticleSubmissionDocument>,
    @InjectModel(Practice.name)
    private readonly practiceModel: Model<PracticeDocument>,
    @InjectModel(Claim.name)
    private readonly claimModel: Model<ClaimDocument>
  ) {}

  async create(dto: CreateEvidenceDto) {
    await this.ensureSubmissionExists(dto.articleDoi);
    const practiceExists = await this.practiceModel.exists({ key: dto.practiceKey });

    if (!practiceExists) {
      throw new BadRequestException('Invalid practice key');
    }

    const claim = await this.claimModel.findOne({ key: dto.claimKey }).lean();
    if (!claim) {
      throw new BadRequestException('Invalid claim key');
    }

    if (claim.practiceKey !== dto.practiceKey) {
      throw new BadRequestException('Claim does not belong to specified practice');
    }

    const evidence = new this.evidenceModel({
      articleDoi: dto.articleDoi,
      practiceKey: dto.practiceKey,
      claimKey: dto.claimKey,
      result: dto.result,
      methodType: dto.methodType ?? EvidenceMethodType.Other,
      participantType: dto.participantType,
      notes: dto.notes,
      analyst: dto.analyst
    });

    const saved = await evidence.save();
    return saved.toObject();
  }

  async findById(id: string) {
    this.ensureValidId(id);
    const evidence = await this.evidenceModel.findById(id).lean();
    if (!evidence) {
      throw new NotFoundException('Evidence not found');
    }
    return evidence;
  }

  async findAll(query: ListEvidenceQueryDto) {
    const { limit = 10, skip = 0, practiceKey, claimKey, result, yearFrom, yearTo } = query;

    const safeLimit = Math.min(Math.max(limit, 0), 100);
    const safeSkip = Math.max(skip, 0);

    const filter: FilterQuery<ArticleEvidenceDocument> = {};

    if (practiceKey) {
      filter.practiceKey = practiceKey;
    }

    if (claimKey) {
      filter.claimKey = claimKey;
    }

    if (result) {
      filter.result = result;
    }

    const articleDoiFilter = await this.buildArticleDoiFilter(yearFrom, yearTo);

    if (articleDoiFilter === null) {
      return {
        items: [],
        total: 0,
        limit: safeLimit,
        skip: safeSkip
      };
    }

    if (articleDoiFilter) {
      filter.articleDoi = { $in: articleDoiFilter };
    }

    const [items, total] = await Promise.all([
      this.evidenceModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(safeSkip)
        .limit(safeLimit)
        .lean(),
      this.evidenceModel.countDocuments(filter)
    ]);

    return {
      items,
      total,
      limit: safeLimit,
      skip: safeSkip
    };
  }

  private async ensureSubmissionExists(doi: string) {
    const submission = await this.submissionModel
      .findOne({
        doi,
        status: SubmissionStatus.Accepted
      })
      .lean();
    if (!submission) {
      throw new BadRequestException('Article submission not found or not accepted');
    }
  }

  async prefillByDoi(doi: string) {
    const submission = await this.submissionModel
      .findOne({ doi: doi.trim().toLowerCase() })
      .lean();
    if (!submission) {
      throw new NotFoundException('Submission not found');
    }
    return {
      title: submission.title,
      authors: submission.authors,
      venue: submission.venue,
      year: submission.year,
      doi: submission.doi,
      assignedAnalyst: submission.assignedAnalyst,
      analysisStatus: submission.analysisStatus
    };
  }

  private async buildArticleDoiFilter(
    yearFrom?: number,
    yearTo?: number
  ): Promise<string[] | null | undefined> {
    if (!yearFrom && !yearTo) {
      return undefined;
    }

    const submissionFilter: FilterQuery<ArticleSubmissionDocument> = {
      status: SubmissionStatus.Accepted,
      doi: { $ne: null }
    };

    if (yearFrom || yearTo) {
      const yearFilter: FilterQuery<ArticleSubmissionDocument>['year'] = {};

      if (yearFrom) {
        yearFilter.$gte = yearFrom;
      }

      if (yearTo) {
        yearFilter.$lte = yearTo;
      }

      submissionFilter.year = yearFilter;
    }

    const dois = await this.submissionModel.distinct('doi', submissionFilter);

    if (!dois.length) {
      return null;
    }

    return dois as string[];
  }

  private ensureValidId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid evidence id');
    }
  }
}
