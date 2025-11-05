import {
  BadRequestException,
  Injectable
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { FilterQuery, Model, PipelineStage } from 'mongoose';
import type { ArticleEvidenceDocument } from '../evidence/schemas/article-evidence.schema';
import { ArticleEvidence, EvidenceResult } from '../evidence/schemas/article-evidence.schema';
import type { PracticeDocument } from '../practices/schemas/practice.schema';
import { Practice } from '../practices/schemas/practice.schema';
import type { ClaimDocument } from '../claims/schemas/claim.schema';
import { Claim } from '../claims/schemas/claim.schema';
import type { ArticleSubmissionDocument } from '../submissions/schemas/article-submission.schema';
import {
  ArticleSubmission,
  SubmissionStatus
} from '../submissions/schemas/article-submission.schema';
import type { UserRatingDocument } from '../ratings/schemas/user-rating.schema';
import { UserRating } from '../ratings/schemas/user-rating.schema';
import type { SearchPracticesDto } from './dto/search-practices.dto';
import type { SearchClaimsDto } from './dto/search-claims.dto';
import type { SearchEvidenceDto } from './dto/search-evidence.dto';
import type { SearchRatingsDto } from './dto/search-ratings.dto';

type ResultCounts = Record<EvidenceResult, number>;

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(Practice.name)
    private readonly practiceModel: Model<PracticeDocument>,
    @InjectModel(Claim.name)
    private readonly claimModel: Model<ClaimDocument>,
    @InjectModel(ArticleEvidence.name)
    private readonly evidenceModel: Model<ArticleEvidenceDocument>,
    @InjectModel(ArticleSubmission.name)
    private readonly submissionModel: Model<ArticleSubmissionDocument>,
    @InjectModel(UserRating.name)
    private readonly ratingModel: Model<UserRatingDocument>
  ) {}

  async searchPractices(query: SearchPracticesDto) {
    const { query: text, limit = 10, skip = 0 } = query;
    const safeLimit = Math.min(Math.max(limit, 0), 100);
    const safeSkip = Math.max(skip, 0);

    const filter: FilterQuery<PracticeDocument> = {};
    if (text) {
      const regex = this.buildContainsRegex(text);
      filter.$or = [{ key: regex }, { name: regex }];
    }

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

  async searchClaims(query: SearchClaimsDto) {
    const { query: text, practiceKey, limit = 10, skip = 0 } = query;
    const safeLimit = Math.min(Math.max(limit, 0), 100);
    const safeSkip = Math.max(skip, 0);

    const filter: FilterQuery<ClaimDocument> = {};
    if (practiceKey) {
      filter.practiceKey = practiceKey;
    }
    if (text) {
      const regex = this.buildContainsRegex(text);
      filter.$or = [{ key: regex }, { text: regex }];
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

  async searchEvidence(query: SearchEvidenceDto) {
    const {
      practiceKey,
      claimKey,
      result,
      from,
      to,
      limit = 10,
      skip = 0
    } = query;

    if (from && to && from > to) {
      throw new BadRequestException('`from` year cannot be greater than `to` year');
    }

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

    const doiFilter = await this.buildArticleDoiFilter(from, to);
    if (doiFilter === null) {
      return {
        items: [],
        total: 0,
        limit: safeLimit,
        skip: safeSkip,
        aggregations: {
          resultCounts: this.emptyResultCounts()
        }
      };
    }

    if (doiFilter) {
      filter.articleDoi = { $in: doiFilter };
    }

    const pipeline: PipelineStage[] = [
      { $match: filter },
      { $sort: { createdAt: -1 } },
      { $skip: safeSkip },
      { $limit: safeLimit },
      {
        $lookup: {
          from: this.submissionModel.collection.name,
          localField: 'articleDoi',
          foreignField: 'doi',
          as: 'submission'
        }
      },
      {
        $addFields: {
          submission: { $first: '$submission' }
        }
      },
      {
        $project: {
          _id: 1,
          articleDoi: 1,
          practiceKey: 1,
          claimKey: 1,
          result: 1,
          methodType: 1,
          participantType: 1,
          analyst: 1,
          notes: 1,
          createdAt: 1,
          article: {
            title: '$submission.title',
            venue: '$submission.venue',
            year: '$submission.year',
            authors: '$submission.authors',
            doi: '$articleDoi'
          }
        }
      }
    ];

    const [items, total, resultAggregation] = await Promise.all([
      this.evidenceModel.aggregate(pipeline).exec(),
      this.evidenceModel.countDocuments(filter),
      this.aggregateEvidenceByResult(filter)
    ]);

    return {
      items,
      total,
      limit: safeLimit,
      skip: safeSkip,
      aggregations: {
        resultCounts: resultAggregation
      }
    };
  }

  async averageRating(query: SearchRatingsDto) {
    const { doi } = query;

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

  private buildContainsRegex(text: string) {
    return new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  }

  private emptyResultCounts(): ResultCounts {
    return {
      [EvidenceResult.Agree]: 0,
      [EvidenceResult.Disagree]: 0,
      [EvidenceResult.Mixed]: 0
    };
  }

  private async aggregateEvidenceByResult(
    filter: FilterQuery<ArticleEvidenceDocument>
  ): Promise<ResultCounts> {
    const counts = this.emptyResultCounts();
    const aggregation = await this.evidenceModel
      .aggregate<{ _id: EvidenceResult; count: number }>([
        { $match: filter },
        {
          $group: {
            _id: '$result',
            count: { $sum: 1 }
          }
        }
      ])
      .exec();

    aggregation.forEach(entry => {
      counts[entry._id] = entry.count;
    });

    return counts;
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
}

